import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { PaginationEntity, PaginationOrder, getMoment } from '@zro/common';
import {
  RemittanceStatus,
  RemittanceRepository,
  RemittanceSide,
  SettlementDateCode,
  settlementDateFromCodeToDate,
  Remittance,
  RemittanceCurrentGroupRepository,
  RemittanceCurrentGroup,
  RemittanceOrderRemittanceRepository,
  RemittanceOrderRemittanceEntity,
  RemittanceRequestSort,
} from '@zro/otc/domain';
import { FeatureSettingName, FeatureSettingState } from '@zro/utils/domain';
import { HolidayLevel, HolidayType } from '@zro/quotations/domain';
import {
  RemittanceEventEmitter,
  ExchangeQuotationEventEmitter,
  OperationService,
  RemittanceNotFoundException,
  QuotationService,
  UtilService,
} from '@zro/otc/application';
import { CurrencyNotFoundException } from '@zro/operations/application';

export class SyncOpenRemittanceUseCase {
  private currentGroupIds: string[];
  private dailyRemittanceGroupIds: string[];
  private groupAmount: number;
  private groupAmountDate: Date;
  private dailyAmount: number;
  private dailyAmountDate: Date;
  private updatedRemittancesIds: string[] = [];
  private readonly PAGE_SIZE = 100;
  private readonly FIRST_PAGE = 1;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param remittanceCurrentGroupCacheRepository RemittanceCurrentGroup cache repository.
   * @param remittanceOrderRemittanceRepository RemittanceOrderRemittance repository.
   * @param operationService Operation service.
   * @param quotationService Quotation service.
   * @param utilService Util service.
   * @param defaultSendDateCode Default send date code.
   * @param defaultReceiveDateCode Default receive date code.
   * @param remittanceRepository Remittance repository.
   * @param remittanceEventEmitter Remittance event emitter.
   * @param exchangeQuotationEventEmitter ExchangeQuotation event emitter.
   * @param pspSettlementDateByStartingTime PSP settlement date by starting time.
   * @param pspMarketOpenTime PSP market open time.
   * @param pspMarketCloseTime PSP market close time.
   * @param pspTradeMinAmount PSP trade minimum amount.
   * @param pspTradeMaxAmount PSP trade maximum amount.
   * @param pspDailyMaxAmount PSP daily max amount.
   */
  constructor(
    private logger: Logger,
    private readonly remittanceCurrentGroupCacheRepository: RemittanceCurrentGroupRepository,
    private readonly remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository,
    private readonly operationService: OperationService,
    private readonly quotationService: QuotationService,
    private readonly utilService: UtilService,
    private readonly defaultSendDateCode: SettlementDateCode,
    private readonly defaultReceiveDateCode: SettlementDateCode,
    private readonly remittanceRepository: RemittanceRepository,
    private readonly remittanceEventEmitter: RemittanceEventEmitter,
    private readonly exchangeQuotationEventEmitter: ExchangeQuotationEventEmitter,
    private readonly pspSettlementDateByStartingTime: string,
    private readonly pspMarketOpenTime: string,
    private readonly pspMarketCloseTime: string,
    private readonly pspTradeMinAmount: number,
    private readonly pspTradeMaxAmount: number,
    private readonly pspDailyMaxAmount: number,
  ) {
    this.logger = logger.child({ context: SyncOpenRemittanceUseCase.name });
  }

  /**
   * Handle opened remittances to send them to PSP.
   */
  async execute(): Promise<void> {
    // Check if psp market is open. If it is closed, do not operate.
    const openTime = getMoment(this.pspMarketOpenTime, 'HH:mm');
    const closeTime = getMoment(this.pspMarketCloseTime, 'HH:mm');
    const now = getMoment();

    if (now <= openTime || now >= closeTime) return;

    // Execute only if the feature setting is activated.
    const setting = await this.utilService.getFeatureSettingByName(
      FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
    );

    this.logger.debug('Feature setting found.', { setting });

    if (setting?.state === FeatureSettingState.DEACTIVE) {
      return;
    }

    // Execute only if today is not a holiday.
    const nowDate = now.toDate();
    const holiday = await this.quotationService.getHolidayByDate(nowDate);

    this.logger.debug('Holiday found.', { holiday });

    if (
      holiday &&
      holiday.type === HolidayType.HOLIDAY &&
      [HolidayLevel.NATIONAL, HolidayLevel.USA].includes(holiday.level)
    )
      return;

    // Initial pagination.
    const pagination = new PaginationEntity({
      page: this.FIRST_PAGE,
      pageSize: this.PAGE_SIZE,
      sort: RemittanceRequestSort.CREATED_AT,
      order: PaginationOrder.ASC,
    });

    // While there are more pages to analyze the data, go on.
    let goOn = true;

    while (goOn) {
      // Get all open remittance.
      const openRemittances = await this.remittanceRepository.getAllByStatus(
        pagination,
        RemittanceStatus.OPEN,
      );

      this.logger.debug('Open remittances found.', {
        remittances: openRemittances?.data,
      });

      // If no open remittance is found, terminate this cron job.
      if (!openRemittances?.data?.length) return;

      for (const [i, remittance] of openRemittances.data.entries()) {
        // Check if remittance has been already updated.
        if (this.updatedRemittancesIds.includes(remittance.id)) continue;

        // Get currency tag.
        const currency = await this.operationService.getCurrencyById(
          remittance.currency.id,
        );

        this.logger.debug('Currency found.', {
          currency,
        });

        if (!currency?.tag) {
          throw new CurrencyNotFoundException({ id: remittance.currency.id });
        }

        remittance.currency = currency;

        const currentGroup =
          await this.remittanceCurrentGroupCacheRepository.getByCurrencySystemProviderSendDateCodeAndReceiveDateCode(
            remittance.currency,
            remittance.system,
            remittance.provider,
            remittance.sendDateCode || this.defaultSendDateCode,
            remittance.receiveDateCode || this.defaultReceiveDateCode,
          );

        this.logger.debug('Remittance current group found.', {
          currentGroup,
        });

        // Configure constants based on current group values.
        this.currentGroupIds = currentGroup?.remittanceGroup || [];
        this.groupAmount = currentGroup?.groupAmount || 0;
        this.groupAmountDate =
          currentGroup?.groupAmountDate || remittance.createdAt;
        this.dailyAmount = currentGroup?.dailyAmount || 0;
        this.dailyAmountDate =
          currentGroup?.dailyAmountDate || getMoment().toDate();
        this.dailyRemittanceGroupIds = currentGroup?.dailyRemittanceGroup || [];

        // If daily amount already exceeds the psp daily amount, wait until next day.
        if (!(await this.calculateNewDailyConstants())) {
          this.logger.debug(
            'Daily amount exceeds the maximum PSP daily amount. Wait until the next util day.',
          );
          continue;
        }

        // If remittance is already in current group, continue.
        if (this.currentGroupIds.includes(remittance.id)) continue;

        // Update group amount.
        this.groupAmount =
          remittance.side === RemittanceSide.BUY
            ? this.groupAmount + remittance.amount
            : this.groupAmount - remittance.amount;

        this.currentGroupIds.push(remittance.id);

        // If accumulated group amount equals 0, close remittances and set isConcomitant to true.
        if (Math.abs(this.groupAmount) === 0) {
          await this.closeConcomitantRemittances(currentGroup);
        }

        // Psp only accepts BUY trading.
        else if (this.groupAmount > 0) {
          // If group amount is over psp trading maximum amount, split last remittance and send to psp.
          if (Math.abs(this.groupAmount) > this.pspTradeMaxAmount) {
            await this.splitAndSendRemittancesToPsp(remittance, i);
          }

          // If group amount reached the acceptable psp trading limit, send remittances to psp.
          else if (
            Math.abs(this.groupAmount) >= this.pspTradeMinAmount &&
            Math.abs(this.groupAmount) <= this.pspTradeMaxAmount
          ) {
            await this.sendRemittancesToPsp(remittance);
          }
        }

        // Update current group in cache.
        const newCurrentGroup: RemittanceCurrentGroup = {
          currency: remittance.currency,
          system: remittance.system,
          provider: remittance.provider,
          sendDateCode: remittance.sendDateCode || this.defaultSendDateCode,
          receiveDateCode:
            remittance.receiveDateCode || this.defaultReceiveDateCode,
          groupAmount: this.groupAmount,
          groupAmountDate: this.groupAmountDate,
          dailyAmount: this.dailyAmount,
          dailyAmountDate: this.dailyAmountDate,
          remittanceGroup: this.currentGroupIds,
          dailyRemittanceGroup: this.dailyRemittanceGroupIds,
        };

        const updatedCurrentGroup =
          await this.remittanceCurrentGroupCacheRepository.createOrUpdate(
            newCurrentGroup,
          );

        this.logger.debug('Updated remittance current group.', {
          updatedCurrentGroup,
        });
      }

      if (openRemittances.page >= openRemittances.pageTotal) {
        goOn = false;
      }

      pagination.page += 1;
    }
  }

  private async calculateNewDailyConstants(): Promise<
    [number, Date, string[]]
  > {
    // Update daily amount and daily amount date.
    const today = getMoment().startOf('day');

    const currentGroupDailyAmountDate = getMoment(this.dailyAmountDate).startOf(
      'day',
    );

    let dailyAmount = this.dailyAmount;
    let dailyAmountDate = this.dailyAmountDate;
    let dailyRemittanceGroupIds = [...this.dailyRemittanceGroupIds];

    if (today.isSame(currentGroupDailyAmountDate)) {
      // Do not insert reopened remittances into daily amount calculation
      await Promise.all(
        this.currentGroupIds.map(async (id) => {
          if (dailyRemittanceGroupIds.indexOf(id) < 0) {
            const remittance = await this.remittanceRepository.getById(id);

            if (!remittance) {
              throw new RemittanceNotFoundException({ id });
            }

            dailyAmount =
              remittance.side === RemittanceSide.BUY
                ? (dailyAmount += remittance.amount)
                : (dailyAmount -= remittance.amount);

            dailyRemittanceGroupIds.push(id);
          }
        }),
      );
    } else if (!today.isSame(currentGroupDailyAmountDate)) {
      // Restart daily amount and daily group.
      dailyAmountDate = getMoment().toDate();
      dailyAmount = Math.abs(this.groupAmount);
      dailyRemittanceGroupIds = [];
      this.currentGroupIds.map((id) => dailyRemittanceGroupIds.push(id));
    }

    // If new daily amount is over the maximum psp daily amount, wait until next day, and do not update this constant.
    if (dailyAmount > this.pspDailyMaxAmount) return;

    return [dailyAmount, dailyAmountDate, dailyRemittanceGroupIds];
  }

  private async closeConcomitantRemittances(
    currentGroup: RemittanceCurrentGroup,
  ) {
    this.logger.debug('Open remittances are concomitant.', {
      currentGroup,
    });

    // Update daily amount and daily amount date.
    const today = getMoment().startOf('day');

    const currentGroupDailyAmountDate = getMoment(this.dailyAmountDate).startOf(
      'day',
    );

    if (!today.isSame(currentGroupDailyAmountDate)) {
      this.dailyAmountDate = getMoment().toDate();
      this.dailyAmount = this.groupAmount;
    }

    // Update remittances status, isConcomitant to true and settlement dates.
    for (const remittanceId of this.currentGroupIds) {
      const remittance = await this.remittanceRepository.getById(remittanceId);

      this.logger.debug('Found remittance.', { remittance });

      if (!remittance) {
        throw new RemittanceNotFoundException({ id: remittanceId });
      }

      const { sendDateCode, receiveDateCode, sendDate, receiveDate } =
        await this.defineSettlementDate(remittance);

      remittance.status = RemittanceStatus.CLOSED;
      remittance.isConcomitant = true;
      remittance.sendDate = sendDate;
      remittance.receiveDate = receiveDate;
      remittance.sendDateCode = sendDateCode;
      remittance.receiveDateCode = receiveDateCode;

      const updated = await this.remittanceRepository.update(remittance);

      this.logger.debug('Updated remittance.', { updated });

      // Emit closed remittance event.
      this.remittanceEventEmitter.closedRemittance(remittance);

      this.updatedRemittancesIds.push(remittance.id);
    }

    // Zero current group constants but keep daily amount values.
    this.groupAmount = 0;
    this.groupAmountDate = null;
    this.currentGroupIds = [];
  }

  private async sendRemittancesToPsp(lastRemittance: Remittance) {
    this.logger.debug('Open remittances reached PSP minimum trade amount.', {
      amount: this.groupAmount,
    });

    // If new daily amount exceeds the psp daily amount, wait until next day.
    const response = await this.calculateNewDailyConstants();

    if (!response) return;

    const [dailyAmount, dailyAmountDate, dailyRemittanceGroupIds] = response;

    this.dailyAmount = dailyAmount;
    this.dailyAmountDate = dailyAmountDate;
    this.dailyRemittanceGroupIds = dailyRemittanceGroupIds;

    const { sendDateCode, receiveDateCode, sendDate, receiveDate } =
      await this.defineSettlementDate(lastRemittance);

    // Update remittances send date and receive date.
    for (const remittanceId of this.currentGroupIds) {
      const remittance = await this.remittanceRepository.getById(remittanceId);

      this.logger.debug('Found remittance.', { remittance });

      if (!remittance) {
        throw new RemittanceNotFoundException({ id: remittanceId });
      }

      remittance.sendDate = sendDate;
      remittance.receiveDate = receiveDate;
      remittance.sendDateCode = sendDateCode;
      remittance.receiveDateCode = receiveDateCode;
      remittance.isConcomitant = false;
      remittance.status = RemittanceStatus.WAITING;

      const updatedRemittance =
        await this.remittanceRepository.update(remittance);

      this.logger.debug('Updated remittance.', {
        remittance: updatedRemittance,
      });

      // Emit waiting remittance event.
      this.remittanceEventEmitter.waitingRemittance(remittance);

      this.updatedRemittancesIds.push(remittance.id);
    }

    // Send current group to PSP
    this.exchangeQuotationEventEmitter.readyExchangeQuotation({
      sendDate,
      receiveDate,
      remittanceIds: this.currentGroupIds,
      currencyTag: lastRemittance.currency.tag,
      providerId: lastRemittance.provider?.id,
      systemId: lastRemittance.system?.id,
    });

    // Zero current group constants but keep daily amount values.
    this.groupAmount = 0;
    this.groupAmountDate = null;
    this.currentGroupIds = [];
  }

  private async splitAndSendRemittancesToPsp(
    lastRemittance: Remittance,
    i: number,
  ) {
    this.logger.debug('Open remittances are over PSP maximum trade amount.', {
      amount: this.groupAmount,
    });

    // Substract overflow amount from last remittance.
    const overflowAmount = Math.abs(this.groupAmount) - this.pspTradeMaxAmount;

    // Check if it is possible to remove overflow amount from last remittance.
    if (lastRemittance.amount - overflowAmount <= 0) {
      // Remove last remittance from current group.
      this.groupAmount =
        lastRemittance.side === RemittanceSide.BUY
          ? this.groupAmount - lastRemittance.amount
          : this.groupAmount + lastRemittance.amount;

      this.currentGroupIds.splice(i, 1);

      return;
    }

    lastRemittance.amount -= overflowAmount;

    const updatedRemittance =
      await this.remittanceRepository.update(lastRemittance);

    this.logger.debug('Updated remittance.', {
      remittance: updatedRemittance,
    });

    // Update group amount.
    this.groupAmount =
      this.groupAmount > 0
        ? this.groupAmount - overflowAmount
        : this.groupAmount + overflowAmount;

    // Create new remittance with overflow amount to be sent in next group, and associate it to the affected remittance orders.
    const newRemittance = {
      id: uuidV4(),
      amount: Math.abs(overflowAmount),
      side: lastRemittance.side,
      type: lastRemittance.type,
      resultAmount: lastRemittance.resultAmount,
      currency: lastRemittance.currency,
      provider: lastRemittance.provider,
      status: lastRemittance.status,
      system: lastRemittance.system,
      sendDate: lastRemittance.sendDate,
      receiveDate: lastRemittance.receiveDate,
      sendDateCode: lastRemittance.sendDateCode,
      receiveDateCode: lastRemittance.receiveDateCode,
      iof: lastRemittance.iof,
    };

    const createdRemittance =
      await this.remittanceRepository.create(newRemittance);

    this.logger.debug('Created new remittance.', {
      remittance: createdRemittance,
    });

    // Emit created remittance event.
    this.remittanceEventEmitter.createdRemittance(newRemittance);

    const remittanceOrdersAssociated =
      await this.remittanceOrderRemittanceRepository.getAllByRemittance(
        lastRemittance,
      );

    for (const assoc of remittanceOrdersAssociated) {
      const newRemittanceOrderRemittance = new RemittanceOrderRemittanceEntity({
        id: uuidV4(),
        remittanceOrder: assoc.remittanceOrder,
        remittance: newRemittance,
      });

      const createdRemittanceOrderRemittance =
        await this.remittanceOrderRemittanceRepository.create(
          newRemittanceOrderRemittance,
        );

      this.logger.debug(
        'Created new remittance order remittance association.',
        { remittanceOrderRemittance: createdRemittanceOrderRemittance },
      );
    }

    await this.sendRemittancesToPsp(lastRemittance);
  }

  private async defineSettlementDate(
    remittance: Remittance,
  ): Promise<Partial<Remittance>> {
    let sendDateCode = remittance.sendDateCode || this.defaultSendDateCode;
    let receiveDateCode =
      remittance.receiveDateCode || this.defaultReceiveDateCode;

    if (this.pspSettlementDateByStartingTime?.length) {
      const pspRules = this.pspSettlementDateByStartingTime
        .split(';')
        .map((hourDate) => hourDate.split('_'));

      const now = getMoment();
      let timeVariant = getMoment(this.pspMarketOpenTime, 'HH:mm');

      for (const pspRule of pspRules) {
        const pspRuleHour = getMoment(pspRule[0], 'HH:mm');
        const pspRuleSendDate = pspRule[1].split('-')[0] as SettlementDateCode;
        const pspRuleReceiveDate = pspRule[1].split(
          '-',
        )[1] as SettlementDateCode;

        if (pspRuleHour && now >= pspRuleHour && pspRuleHour > timeVariant) {
          timeVariant = pspRuleHour;
          sendDateCode = pspRuleSendDate;
          receiveDateCode = pspRuleReceiveDate;
        }
      }
    }

    return {
      sendDateCode,
      receiveDateCode,
      ...settlementDateFromCodeToDate(
        getMoment().toDate(),
        sendDateCode,
        receiveDateCode,
      ),
    };
  }
}
