import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { MissingDataException, formatValueFromFloatToInt } from '@zro/common';
import {
  CreateExchangeQuotationRequest,
  ExchangeQuotationGateway,
  RemittanceNotFoundException,
  OperationService,
  UtilService,
  QuotationService,
  RemittanceInvalidStatusException,
  ExchangeQuotationInvalidStateException,
  ExchangeQuotationPspException,
  AcceptExchangeQuotationRequest,
} from '@zro/otc/application';
import {
  ExchangeQuotation,
  ExchangeQuotationEntity,
  ExchangeQuotationRepository,
  ExchangeQuotationServerRepository,
  ExchangeQuotationState,
  Remittance,
  RemittanceRepository,
  RemittanceStatus,
  RemittanceExchangeQuotationRepository,
  RemittanceSide,
  RemittanceExchangeQuotationEntity,
  Provider,
  System,
} from '@zro/otc/domain';
import { CurrencyNotFoundException } from '@zro/operations/application';
import { FeatureSettingName, FeatureSettingState } from '@zro/utils/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { StreamQuotationNotFoundException } from '@zro/quotations/application';

export class HandleCreateAndAcceptExchangeQuotationEventUseCase {
  private logger: Logger;
  constructor(
    logger: Logger,
    private readonly pspGateway: ExchangeQuotationGateway,
    private readonly exchangeQuotationRepository: ExchangeQuotationRepository,
    private readonly exchangeQuotationServerRepository: ExchangeQuotationServerRepository,
    private readonly remittanceRepository: RemittanceRepository,
    private readonly remittanceExchangeQuotationRepository: RemittanceExchangeQuotationRepository,
    private readonly operationService: OperationService,
    private readonly utilService: UtilService,
    private readonly quotationService: QuotationService,
    private readonly zroBankPartnerId: number,
    private readonly operationCurrencySymbolUsd: string,
  ) {
    this.logger = logger.child({
      context: HandleCreateAndAcceptExchangeQuotationEventUseCase.name,
    });
  }

  async execute(
    remittanceIds: Remittance['id'][],
    sendDate: Remittance['sendDate'],
    receiveDate: Remittance['receiveDate'],
    currencyTag: Currency['tag'],
    provider?: Provider,
    system?: System,
  ): Promise<ExchangeQuotation> {
    if (!remittanceIds?.length || !sendDate || !receiveDate || !currencyTag) {
      throw new MissingDataException([
        ...(!remittanceIds?.length ? ['Remittance Ids'] : []),
        ...(!sendDate ? ['Send date'] : []),
        ...(!receiveDate ? ['Receive date'] : []),
        ...(!currencyTag ? ['Currency tag'] : []),
      ]);
    }

    const setting = await this.utilService.getFeatureSettingByName(
      FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
    );

    if (setting?.state === FeatureSettingState.DEACTIVE) {
      return;
    }

    // Validate Remittances
    const remittances: Remittance[] =
      await this.validateRemittances(remittanceIds);

    // Validate currency
    const currencyFound =
      await this.operationService.getCurrencyByTag(currencyTag);

    this.logger.debug('Currency found.', { currency: currencyFound });

    if (!currencyFound) {
      throw new CurrencyNotFoundException({
        tag: currencyTag,
      });
    }

    // Get Oficial Quotation
    const baseCurrency = new CurrencyEntity({
      symbol: this.operationCurrencySymbolUsd,
    });

    const streamQuotationFound =
      await this.quotationService.getStreamQuotationByBaseCurrency(
        baseCurrency,
      );

    this.logger.debug('Stream quotation found.', {
      streamQuotation: streamQuotationFound,
    });

    if (!streamQuotationFound) {
      throw new StreamQuotationNotFoundException({ baseCurrency });
    }

    // Average price between buy and sell
    const price = (streamQuotationFound.buy + streamQuotationFound.sell) / 2;

    const { groupAmount, side } = this.mountParams(remittances);

    // Body for send to metric
    const oficialExchangeQuotation = new ExchangeQuotationEntity({
      quotation: formatValueFromFloatToInt(price),
      gatewayName: streamQuotationFound.gatewayName,
    });

    // Create exchange quotation.
    const bodyCreate: CreateExchangeQuotationRequest = {
      side,
      currencyTag,
      amount: Math.abs(groupAmount),
      sendDate: sendDate,
      receiveDate: receiveDate,
      zroBankPartnerId: this.zroBankPartnerId,
    };

    this.logger.debug('Create exchange quotation psp request.', {
      request: bodyCreate,
    });

    const pspResultCreate =
      await this.pspGateway.createExchangeQuotation(bodyCreate);

    this.logger.debug('Create exchange quotation psp response.', {
      response: pspResultCreate,
    });

    if (!pspResultCreate) {
      this.logger.error('Exchange quotation has not been created.');
      throw new ExchangeQuotationPspException();
    }

    const newExchangeQuotation = new ExchangeQuotationEntity({
      id: uuidV4(),
      quotationPspId: pspResultCreate.quotationId,
      solicitationPspId: pspResultCreate.id,
      quotation: pspResultCreate.fxRate,
      gatewayName: pspResultCreate.gatewayName,
      amount: pspResultCreate.externalValue,
      amountExternalCurrency: pspResultCreate.internalValue,
      state: ExchangeQuotationState.ACCEPTED,
      ...(provider && { provider }),
      ...(system && { system }),
    });

    // Accept Exchange quotation.
    const payloadAccept: AcceptExchangeQuotationRequest = {
      quotationPspId: newExchangeQuotation.quotationPspId,
      solicitationPspId: newExchangeQuotation.solicitationPspId,
    };

    this.logger.debug('Accept exchange quotation psp request.', {
      request: payloadAccept,
    });

    const pspResultAccept =
      await this.pspGateway.acceptExchangeQuotation(payloadAccept);

    this.logger.debug('Accept exchange quotation psp response.', {
      response: pspResultAccept,
    });

    if (!pspResultAccept) {
      this.logger.error('Exchange quotation has not been accepted.');
      throw new ExchangeQuotationPspException();
    }

    // Save new accepted exchange quotation into repository.
    await this.exchangeQuotationRepository.create(newExchangeQuotation);

    await this.exchangeQuotationServerRepository.createOrUpdate([
      newExchangeQuotation,
      oficialExchangeQuotation,
    ]);

    this.logger.debug('Created new exchange quotation.', {
      exchangeQuotation: newExchangeQuotation,
    });

    // Create remittance exchange quotation.
    for (const remittance of remittances) {
      const newRemittanceExchangeQuotation =
        new RemittanceExchangeQuotationEntity({
          id: uuidV4(),
          remittance: remittance,
          exchangeQuotation: newExchangeQuotation,
        });

      await this.remittanceExchangeQuotationRepository.create(
        newRemittanceExchangeQuotation,
      );

      this.logger.debug('Create new remittance exchange quotation.', {
        remittanceExchangeQuotation: newRemittanceExchangeQuotation,
      });
    }

    return newExchangeQuotation;
  }

  private async validateRemittances(
    remittanceIds: Remittance['id'][],
  ): Promise<Remittance[]> {
    const remittances: Remittance[] = [];
    // Validate all remittances received
    for (const remittanceId of remittanceIds) {
      const remittanceFound =
        await this.remittanceRepository.getById(remittanceId);

      this.logger.debug('Remittance found.', { remittance: remittanceFound });

      if (!remittanceFound) {
        throw new RemittanceNotFoundException({ id: remittanceId });
      }

      if (remittanceFound.status != RemittanceStatus.WAITING) {
        throw new RemittanceInvalidStatusException({ id: remittanceId });
      }

      if (!remittanceFound?.side || !remittanceFound?.amount) {
        throw new MissingDataException([
          ...(!remittanceFound?.side ? ['Remittance Side'] : []),
          ...(!remittanceFound?.amount ? ['Remittance Amount'] : []),
        ]);
      }

      // Check invalid state (Only reprocess remittance if exchangeQuotation state is differ than PENDING and ACCEPTED)
      const remittanceExchangeQuotations =
        await this.remittanceExchangeQuotationRepository.getAllByRemittance(
          remittanceFound,
        );

      this.logger.debug('Remittance Exchange quotations found.', {
        remittanceExchangeQuotations,
      });

      if (remittanceExchangeQuotations.length) {
        for (const remittanceExchangeQuotation of remittanceExchangeQuotations) {
          if (
            [
              ExchangeQuotationState.PENDING,
              ExchangeQuotationState.ACCEPTED,
            ].includes(remittanceExchangeQuotation.exchangeQuotation.state)
          ) {
            throw new ExchangeQuotationInvalidStateException(
              remittanceExchangeQuotation.exchangeQuotation,
            );
          }
        }
      }

      remittances.push(remittanceFound);
    }

    return remittances;
  }

  private mountParams(remittances: Remittance[]) {
    const groupAmount = remittances.reduce((acc, cur) => {
      acc += cur.side === RemittanceSide.BUY ? cur.amount : -cur.amount;
      return acc;
    }, 0);

    const side = groupAmount >= 0 ? RemittanceSide.BUY : RemittanceSide.SELL;

    return { groupAmount, side };
  }
}
