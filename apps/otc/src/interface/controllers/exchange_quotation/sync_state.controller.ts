import { Logger } from 'winston';
import {
  ExchangeQuotationGateway,
  SyncStateExchangeQuotationUseCase,
} from '@zro/otc/application';
import {
  ExchangeQuotationRepository,
  RemittanceExchangeQuotationRepository,
  RemittanceRepository,
} from '@zro/otc/domain';
import {
  RemittanceEventEmitterControllerInterface,
  RemittanceEventEmitterController,
  ExchangeQuotationEventEmitterController,
  ExchangeQuotationEventEmitterControllerInterface,
} from '@zro/otc/interface';

export class SyncStateExchangeQuotationController {
  private usecase: SyncStateExchangeQuotationUseCase;

  constructor(
    private logger: Logger,
    pspGateway: ExchangeQuotationGateway,
    exchangeQuotationRepository: ExchangeQuotationRepository,
    remittanceRepository: RemittanceRepository,
    remittanceExchangeQuotationRepository: RemittanceExchangeQuotationRepository,
    remittanceServiceEventEmitter: RemittanceEventEmitterControllerInterface,
    exchangeQuotationServiceEventEmitter: ExchangeQuotationEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: SyncStateExchangeQuotationController.name,
    });

    const remittanceEventEmitter = new RemittanceEventEmitterController(
      remittanceServiceEventEmitter,
    );

    const exchangeQuotationEventEmitter =
      new ExchangeQuotationEventEmitterController(
        exchangeQuotationServiceEventEmitter,
      );

    this.usecase = new SyncStateExchangeQuotationUseCase(
      logger,
      pspGateway,
      exchangeQuotationRepository,
      remittanceRepository,
      remittanceExchangeQuotationRepository,
      remittanceEventEmitter,
      exchangeQuotationEventEmitter,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync  exchange quotation state.');

    await this.usecase.execute();
  }
}
