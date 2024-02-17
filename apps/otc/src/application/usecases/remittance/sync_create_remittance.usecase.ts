import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import {
  RemittanceOrderCurrentGroupRepository,
  RemittanceOrderRepository,
  RemittanceExposureRuleRepository,
  RemittanceOrderCurrentGroup,
  RemittanceEntity,
  RemittanceStatus,
  RemittanceRepository,
  RemittanceOrderStatus,
  RemittanceOrderSide,
  RemittanceSide,
  RemittanceType,
  RemittanceOrder,
  SettlementDateCode,
  settlementDateFromCodeToDate,
  RemittanceExposureRule,
  Remittance,
  RemittanceOrderRemittanceEntity,
  RemittanceOrderRemittanceRepository,
  RemittanceOrderRequestSort,
} from '@zro/otc/domain';
import {
  RemittanceOrderEventEmitter,
  RemittanceEventEmitter,
  RemittanceExposureRuleNotFoundException,
} from '@zro/otc/application';
import { PaginationEntity, PaginationOrder, getMoment } from '@zro/common';

export class SyncCreateRemittanceUseCase {
  private currentGroupIds: string[];
  private groupAmount: number;
  private groupAmountDate: Date;
  private dailyAmount: number;
  private dailyAmountDate: Date;
  private updatedOrdersIds: string[] = [];
  private readonly PAGE_SIZE = 100;
  private readonly FIRST_PAGE = 1;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param remittanceOrderRepository Remittance Order repository.
   * @param remittanceOrderCurrentGroupCacheRepository Crypto Remittance Current Group cache repository.
   * @param defaultSendDateCode Default remittance settlement send date.
   * @param defaultReceiveDateCode Default remittance settlement receive date.
   * @param remittanceExposureRuleRepository Remittance Exposure Rule repository.
   * @param remittanceRepository Remittance repository.
   * @param remittanceOrderEventEmitter Remittance order event emitter.
   * @param remittanceEventEmitter Remittance event emitter.
   * @param remittanceOrderRemittanceRepository RemittanceOrderRemittance repository.
   */
  constructor(
    private logger: Logger,
    private readonly remittanceOrderRepository: RemittanceOrderRepository,
    private readonly remittanceOrderCurrentGroupCacheRepository: RemittanceOrderCurrentGroupRepository,
    private readonly defaultSendDateCode: SettlementDateCode,
    private readonly defaultReceiveDateCode: SettlementDateCode,
    private readonly remittanceExposureRuleRepository: RemittanceExposureRuleRepository,
    private readonly remittanceRepository: RemittanceRepository,
    private readonly remittanceOrderEventEmitter: RemittanceOrderEventEmitter,
    private readonly remittanceEventEmitter: RemittanceEventEmitter,
    private readonly remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository,
  ) {
    this.logger = logger.child({
      context: SyncCreateRemittanceUseCase.name,
    });
  }

  /**
   * Create new remittance based on opened remittance orders.
   */
  async execute(): Promise<void> {
    // Initial pagination.
    const pagination = new PaginationEntity({
      page: this.FIRST_PAGE,
      pageSize: this.PAGE_SIZE,
      sort: RemittanceOrderRequestSort.CREATED_AT,
      order: PaginationOrder.ASC,
    });

    // While there are more pages to analyze the data, go on.
    let goOn = true;

    while (goOn) {
      // Get all open remittance orders.
      const openRemittanceOrders =
        await this.remittanceOrderRepository.getAllByStatus(
          pagination,
          RemittanceOrderStatus.OPEN,
        );

      this.logger.debug('Open remittance orders found.', {
        remittanceOrders: openRemittanceOrders?.data,
      });

      // If no open remittance order is found, terminate this cron job.
      if (!openRemittanceOrders?.data?.length) return;

      for (const remittanceOrder of openRemittanceOrders.data) {
        // Check if remittance order has been already updated.
        if (this.updatedOrdersIds.includes(remittanceOrder.id)) continue;

        const currentGroup =
          await this.remittanceOrderCurrentGroupCacheRepository.getByCurrencySystemProviderSendDateCodeAndReceiveDateCode(
            remittanceOrder.currency,
            remittanceOrder.system,
            remittanceOrder.provider,
            remittanceOrder.sendDateCode || this.defaultSendDateCode,
            remittanceOrder.receiveDateCode || this.defaultReceiveDateCode,
          );

        this.logger.debug('Remittance order current group found.', {
          currentGroup,
        });

        // Configure constants based on current group values.
        this.currentGroupIds = currentGroup?.remittanceOrderGroup || [];
        this.groupAmount = currentGroup?.groupAmount || 0;
        this.groupAmountDate =
          currentGroup?.groupAmountDate || remittanceOrder.createdAt;
        this.dailyAmount = currentGroup?.dailyAmount || 0;
        this.dailyAmountDate =
          currentGroup?.dailyAmountDate || getMoment().toDate();

        // If remittanceOrder is already in current group, do not update constants.
        if (!this.currentGroupIds.includes(remittanceOrder.id)) {
          // Update group amount.
          this.groupAmount =
            remittanceOrder.side === RemittanceOrderSide.BUY
              ? this.groupAmount + remittanceOrder.amount
              : this.groupAmount - remittanceOrder.amount;

          this.currentGroupIds.push(remittanceOrder.id);
        }

        // Get currency exposure rule.
        const exposureRule =
          await this.remittanceExposureRuleRepository.getByCurrency(
            remittanceOrder.currency,
          );

        this.logger.debug('Remittance exposure rule found.', {
          exposureRule,
        });

        if (!exposureRule) {
          throw new RemittanceExposureRuleNotFoundException({
            currency: remittanceOrder.currency,
          });
        }

        // Check how many seconds has passed since the current group started date.
        const accumulatedSeconds =
          getMoment().unix() - getMoment(this.groupAmountDate).unix();

        // If accumulated constants reached the currency exposure limit, create a new remittance.
        if (
          accumulatedSeconds >= exposureRule.seconds ||
          Math.abs(this.groupAmount) >= exposureRule.amount
        ) {
          await this.createNewRemittance(
            remittanceOrder,
            currentGroup,
            exposureRule,
          );
        }

        // Update current group in cache.
        const newCurrentGroup: RemittanceOrderCurrentGroup = {
          currency: remittanceOrder.currency,
          system: remittanceOrder.system,
          provider: remittanceOrder.provider,
          sendDateCode:
            remittanceOrder.sendDateCode || this.defaultSendDateCode,
          receiveDateCode:
            remittanceOrder.receiveDateCode || this.defaultReceiveDateCode,
          groupAmount: this.groupAmount,
          groupAmountDate: this.groupAmountDate,
          dailyAmount: this.dailyAmount,
          dailyAmountDate: this.dailyAmountDate,
          remittanceOrderGroup: this.currentGroupIds,
        };

        const updatedCurrentGroup =
          await this.remittanceOrderCurrentGroupCacheRepository.createOrUpdate(
            newCurrentGroup,
          );

        this.logger.debug('Updated remittance order current group.', {
          updatedCurrentGroup,
        });
      }

      if (openRemittanceOrders.page >= openRemittanceOrders.pageTotal) {
        goOn = false;
      }

      pagination.page += 1;
    }
  }

  private async createNewRemittance(
    remittanceOrder: RemittanceOrder,
    currentGroup: RemittanceOrderCurrentGroup,
    exposureRule: RemittanceExposureRule,
  ) {
    this.logger.debug('Open remittance orders reached exposure limit.', {
      currentGroup,
    });

    // Update daily amount and daily amount date.
    const today = getMoment().startOf('day');

    const currentGroupDailyAmountDate = getMoment(this.dailyAmountDate).startOf(
      'day',
    );

    if (today.isSame(currentGroupDailyAmountDate)) {
      this.dailyAmount += this.groupAmount;
    } else if (!today.isSame(currentGroupDailyAmountDate)) {
      this.dailyAmountDate = getMoment().toDate();
      this.dailyAmount = this.groupAmount;
    }

    const { sendDateCode, receiveDateCode, sendDate, receiveDate } =
      await this.defineSettlementDate(exposureRule, remittanceOrder);

    // Create new remittance.
    const remittance = new RemittanceEntity({
      id: uuidV4(),
      side: this.groupAmount >= 0 ? RemittanceSide.BUY : RemittanceSide.SELL,
      type: RemittanceType.CRYPTO,
      currency: remittanceOrder.currency,
      amount: Math.abs(this.groupAmount),
      status: RemittanceStatus.OPEN,
      system: remittanceOrder.system,
      provider: remittanceOrder.provider,
      sendDate,
      receiveDate,
      sendDateCode,
      receiveDateCode,
    });

    const newRemittance = await this.remittanceRepository.create(remittance);

    this.logger.debug('Created new remittance.', {
      newRemittance,
    });

    // Emit created remittance event.
    this.remittanceEventEmitter.createdRemittance(remittance);

    // Update remittance orders status and remittance reference.
    for (const remittanceOrderId of this.currentGroupIds) {
      const order =
        await this.remittanceOrderRepository.getById(remittanceOrderId);

      this.logger.debug('Found remittance order.', {
        order,
      });

      if (!order) return;

      order.status = RemittanceOrderStatus.CLOSED;

      const updatedOrder = await this.remittanceOrderRepository.update(order);

      this.logger.debug('Updated remittance order.', {
        updatedOrder,
      });

      // Emit closed remittance order event.
      this.remittanceOrderEventEmitter.closedRemittanceOrder(order);

      //Associate remittance order to remittance.
      const newAssociation = new RemittanceOrderRemittanceEntity({
        id: uuidV4(),
        remittanceOrder: order,
        remittance: remittance,
      });

      await this.remittanceOrderRemittanceRepository.create(newAssociation);

      this.logger.debug(
        'Created new remittance order remittance association.',
        {
          remittanceOrderRemittance: newAssociation,
        },
      );

      this.updatedOrdersIds.push(order.id);
    }

    // Zero current group constants but keep daily amount values.
    this.groupAmount = 0;
    this.groupAmountDate = null;
    this.currentGroupIds = [];
  }

  private async defineSettlementDate(
    exposureRule: RemittanceExposureRule,
    remittanceOrder: RemittanceOrder,
  ): Promise<Partial<Remittance>> {
    let sendDateCode = remittanceOrder.sendDateCode || this.defaultSendDateCode;
    let receiveDateCode =
      remittanceOrder.receiveDateCode || this.defaultReceiveDateCode;

    if (exposureRule.settlementDateRules) {
      let ruleAmount = 0;

      for (const rule of exposureRule.settlementDateRules) {
        if (
          rule.amount &&
          this.dailyAmount >= rule.amount &&
          rule.amount > ruleAmount
        ) {
          ruleAmount = rule.amount;
          sendDateCode = rule.sendDate;
          receiveDateCode = rule.receiveDate;
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
