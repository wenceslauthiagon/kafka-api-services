import { Logger } from 'winston';
import { IsDefined } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  ConversionRepository,
  CryptoOrder,
  CryptoOrderRepository,
  CryptoRemittanceRepository,
  ProviderRepository,
  System,
} from '@zro/otc/domain';
import { Currency } from '@zro/operations/domain';
import {
  SyncMarketPendingCryptoOrdersUseCase as UseCase,
  CryptoRemittanceGateway,
  QuotationService,
} from '@zro/otc/application';
import {
  CryptoOrderEventEmitterController,
  CryptoOrderEventEmitterControllerInterface,
  CryptoRemittanceEventEmitterController,
  CryptoRemittanceEventEmitterControllerInterface,
} from '@zro/otc/interface';

type TSyncMarketPendingCryptoOrdersRequest = Pick<CryptoOrder, 'baseCurrency'>;

export class SyncMarketPendingCryptoOrdersRequest
  extends AutoValidator
  implements TSyncMarketPendingCryptoOrdersRequest
{
  @IsDefined()
  baseCurrency: Currency;

  constructor(props: TSyncMarketPendingCryptoOrdersRequest) {
    super(props);
  }
}

export class SyncMarketPendingCryptoOrdersController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param cryptoOrderRepository CryptoOrderRepository repository.
   * @param cryptoOrderServiceEventEmitter CryptoOrder event emitter.
   */
  constructor(
    private logger: Logger,
    cryptoRemittanceRepository: CryptoRemittanceRepository,
    cryptoOrderRepository: CryptoOrderRepository,
    providerRepository: ProviderRepository,
    conversionRepository: ConversionRepository,
    cryptoOrderServiceEventEmitter: CryptoOrderEventEmitterControllerInterface,
    cryptoRemittanceServiceEventEmitter: CryptoRemittanceEventEmitterControllerInterface,
    cryptoRemittanceGateways: CryptoRemittanceGateway[],
    quotationService: QuotationService,
    system: System[],
  ) {
    this.logger = logger.child({
      context: SyncMarketPendingCryptoOrdersController.name,
    });

    const cryptoOrderEventEmitter = new CryptoOrderEventEmitterController(
      cryptoOrderServiceEventEmitter,
    );

    const cryptoRemittanceEventEmitter =
      new CryptoRemittanceEventEmitterController(
        cryptoRemittanceServiceEventEmitter,
      );

    this.usecase = new UseCase(
      this.logger,
      cryptoRemittanceRepository,
      cryptoOrderRepository,
      providerRepository,
      conversionRepository,
      quotationService,
      cryptoRemittanceGateways,
      cryptoRemittanceEventEmitter,
      cryptoOrderEventEmitter,
      system,
    );
  }

  async execute(request: SyncMarketPendingCryptoOrdersRequest): Promise<void> {
    this.logger.debug(
      'Sync pending crypto order conversion and request to psp.',
      { request },
    );

    await this.usecase.execute(request.baseCurrency);
  }
}
