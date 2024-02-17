import { Logger } from 'winston';
import {
  OperationService,
  QuotationService,
  SyncOpenRemittanceUseCase as UseCase,
  UtilService,
} from '@zro/otc/application';
import {
  RemittanceRepository,
  SettlementDateCode,
  RemittanceOrderRemittanceRepository,
  RemittanceCurrentGroupRepository,
} from '@zro/otc/domain';
import {
  RemittanceEventEmitterController,
  ExchangeQuotationEventEmitterController,
  RemittanceEventEmitterControllerInterface,
  ExchangeQuotationEventEmitterControllerInterface,
} from '@zro/otc/interface';

export class SyncOpenRemittanceController {
  private readonly usecase: UseCase;

  constructor(
    private logger: Logger,
    remittanceCurrentGroupCacheRepository: RemittanceCurrentGroupRepository,
    remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository,
    operationService: OperationService,
    quotationService: QuotationService,
    utilService: UtilService,
    defaultSendDateCode: SettlementDateCode,
    defaultReceiveDateCode: SettlementDateCode,
    remittanceRepository: RemittanceRepository,
    remittanceServiceEventEmitter: RemittanceEventEmitterControllerInterface,
    exchangeQuotationServiceEventEmitter: ExchangeQuotationEventEmitterControllerInterface,
    pspSettlementDateByStartingTime: string,
    pspMarketOpenTime: string,
    pspMarketOpenCloseTime: string,
    pspTradeMinAmount: number,
    pspTradeMaxAmount: number,
    pspDailyMaxAmount: number,
  ) {
    this.logger = logger.child({
      context: SyncOpenRemittanceController.name,
    });

    const remittanceEventEmitter = new RemittanceEventEmitterController(
      remittanceServiceEventEmitter,
    );

    const exchangeQuotationEventEmitter =
      new ExchangeQuotationEventEmitterController(
        exchangeQuotationServiceEventEmitter,
      );

    this.usecase = new UseCase(
      this.logger,
      remittanceCurrentGroupCacheRepository,
      remittanceOrderRemittanceRepository,
      operationService,
      quotationService,
      utilService,
      defaultSendDateCode,
      defaultReceiveDateCode,
      remittanceRepository,
      remittanceEventEmitter,
      exchangeQuotationEventEmitter,
      pspSettlementDateByStartingTime,
      pspMarketOpenTime,
      pspMarketOpenCloseTime,
      pspTradeMinAmount,
      pspTradeMaxAmount,
      pspDailyMaxAmount,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Started open remittance request.');

    await this.usecase.execute();

    this.logger.debug('Finished open remittance response.');
  }
}
