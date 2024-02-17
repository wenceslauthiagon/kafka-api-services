import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { CurrencyEntity } from '@zro/operations/domain';
import {
  ConversionEntity,
  CryptoOrder,
  CryptoOrderEntity,
  CryptoRemittance,
  CryptoRemittanceEntity,
  ProviderEntity,
  Remittance,
  RemittanceEntity,
  SystemEntity,
} from '@zro/otc/domain';
import {
  OtcService,
  GetProviderByIdServiceRequest,
  GetProviderByIdServiceResponse,
  CreateCryptoRemittanceServiceRequest,
  CreateCryptoOrderServiceResponse,
  GetSystemByNameServiceRequest,
  GetSystemByNameServiceResponse,
  CreateCryptoOrderServiceRequest,
  GetCryptoOrderByIdServiceRequest,
  GetCryptoRemittanceByIdServiceRequest,
  GetRemittanceByIdServiceRequest,
} from '@zro/otc-bot/application';
import {
  CreateCryptoOrderRequest,
  CreateCryptoRemittanceRequest,
  GetCryptoOrderByIdRequest,
  GetCryptoRemittanceByIdRequest,
  GetProviderByIdRequest,
  GetRemittanceByIdRequest,
  GetSystemByNameRequest,
} from '@zro/otc/interface';
import {
  CreateCryptoOrderServiceKafka,
  CreateCryptoRemittanceServiceKafka,
  GetCryptoOrderByIdServiceKafka,
  GetCryptoRemittanceByIdServiceKafka,
  GetProviderByIdServiceKafka,
  GetRemittanceByIdServiceKafka,
  GetSystemByNameServiceKafka,
} from '@zro/otc/infrastructure';

/**
 * Otc microservice
 */
export class OtcServiceKafka implements OtcService {
  static _services: any[] = [
    CreateCryptoOrderServiceKafka,
    CreateCryptoRemittanceServiceKafka,
    GetCryptoOrderByIdServiceKafka,
    GetCryptoRemittanceByIdServiceKafka,
    GetProviderByIdServiceKafka,
    GetRemittanceByIdServiceKafka,
    GetSystemByNameServiceKafka,
  ];

  private readonly getProviderByIdService: GetProviderByIdServiceKafka;
  private readonly createCryptoRemittanceService: CreateCryptoRemittanceServiceKafka;
  private readonly createCryptoOrderService: CreateCryptoOrderServiceKafka;
  private readonly getSystemByNameService: GetSystemByNameServiceKafka;
  private readonly getCryptoOrderByIdService: GetCryptoOrderByIdServiceKafka;
  private readonly getCryptoRemittanceByIdService: GetCryptoRemittanceByIdServiceKafka;
  private readonly getRemittanceByIdService: GetRemittanceByIdServiceKafka;

  /**
   * Default constructor.
   * @param requestId The request id.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: OtcServiceKafka.name });

    this.getProviderByIdService = new GetProviderByIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.createCryptoRemittanceService = new CreateCryptoRemittanceServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.createCryptoOrderService = new CreateCryptoOrderServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getSystemByNameService = new GetSystemByNameServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getCryptoOrderByIdService = new GetCryptoOrderByIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getCryptoRemittanceByIdService =
      new GetCryptoRemittanceByIdServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.getRemittanceByIdService = new GetRemittanceByIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  async createCryptoRemittance(
    request: CreateCryptoRemittanceServiceRequest,
  ): Promise<void> {
    const remote = new CreateCryptoRemittanceRequest({
      id: request.id,
      market: request.market,
      amount: request.amount,
      type: request.type,
      side: request.side,
      status: request.status,
      price: request.price,
      stopPrice: request.stopPrice,
      validUntil: request.validUntil,
      providerOrderId: request.providerOrderId,
      providerName: request.providerName,
      executedPrice: request.executedPrice,
      executedAmount: request.executedAmount,
      fee: request.fee,
      baseCurrencyId: request.baseCurrency.id,
      baseCurrencyDecimal: request.baseCurrency.decimal,
      baseCurrencySymbol: request.baseCurrency.symbol,
      baseCurrencyType: request.baseCurrency.type,
      quoteCurrencyId: request.quoteCurrency.id,
      quoteCurrencyDecimal: request.quoteCurrency.decimal,
      quoteCurrencySymbol: request.quoteCurrency.symbol,
      quoteCurrencyType: request.quoteCurrency.type,
      providerId: request.provider.id,
    });

    await this.createCryptoRemittanceService.execute(remote);
  }

  async getProviderById(
    request: GetProviderByIdServiceRequest,
  ): Promise<GetProviderByIdServiceResponse> {
    const remote = new GetProviderByIdRequest({
      id: request.id,
    });

    const response = await this.getProviderByIdService.execute(remote);

    if (!response) return null;

    return {
      id: response.id,
      name: response.name,
      description: response.description,
      createdAt: response.createdAt,
    };
  }

  async createCryptoOrder(
    request: CreateCryptoOrderServiceRequest,
  ): Promise<CreateCryptoOrderServiceResponse> {
    const remote = new CreateCryptoOrderRequest({
      id: request.id,
      state: request.state,
      baseCurrencyId: request.baseCurrency.id,
      providerId: request.provider?.id,
      systemId: request.system.id,
      cryptoRemittanceId: request.cryptoRemittance?.id,
      amount: request.amount,
      type: request.type,
      side: request.side,
      createdAt: request.createdAt,
      price: request.price,
      stopPrice: request.stopPrice,
      validUntil: request.validUntil,
    });

    const response = await this.createCryptoOrderService.execute(remote);

    if (!response) return null;

    return {
      ...request,
      createdAt: response.createdAt,
    };
  }

  async getSystemByName(
    request: GetSystemByNameServiceRequest,
  ): Promise<GetSystemByNameServiceResponse> {
    const remote = new GetSystemByNameRequest({
      name: request.name,
    });

    const response = await this.getSystemByNameService.execute(remote);

    if (!response) return null;

    return {
      id: response.id,
      name: response.name,
      description: response.description,
      createdAt: response.createdAt,
    };
  }

  async getCryptoOrderById(
    request: GetCryptoOrderByIdServiceRequest,
  ): Promise<CryptoOrder> {
    const remote = new GetCryptoOrderByIdRequest({
      id: request.id,
    });

    const response = await this.getCryptoOrderByIdService.execute(remote);

    if (!response) return null;

    return new CryptoOrderEntity({
      id: response.id,
      amount: response.amount,
      type: response.type,
      side: response.side,
      state: response.state,
      clientName: response.clientName,
      clientDocument: response.clientDocument,
      clientDocumentType: response.clientDocumentType,
      reconciledId: response.reconciledId,
      baseCurrency: new CurrencyEntity({ id: response.baseCurrencyId }),
      system: new SystemEntity({ id: response.systemId }),
      user: new UserEntity({ uuid: response.userId }),
      provider: new ProviderEntity({ id: response.providerId }),
      conversion: new ConversionEntity({ id: response.conversionId }),
      cryptoRemittance: new CryptoRemittanceEntity({
        id: response.cryptoRemittanceId,
      }),
      remainingCryptoRemittance: new CryptoRemittanceEntity({
        id: response.remainingCryptoRemittanceId,
      }),
      previousCryptoRemittance: new CryptoRemittanceEntity({
        id: response.previousCryptoRemittanceId,
      }),
      createdAt: response.createdAt,
    });
  }

  async getCryptoRemittanceById(
    request: GetCryptoRemittanceByIdServiceRequest,
  ): Promise<CryptoRemittance> {
    const remote = new GetCryptoRemittanceByIdRequest({
      id: request.id,
    });

    const response = await this.getCryptoRemittanceByIdService.execute(remote);

    if (!response) return null;

    return new CryptoRemittanceEntity({
      id: response.id,
      market: response.market,
      amount: response.amount,
      type: response.type,
      side: response.side,
      status: response.status,
      price: response.price,
      stopPrice: response.stopPrice,
      validUntil: response.validUntil,
      providerOrderId: response.providerOrderId,
      providerName: response.providerName,
      executedPrice: response.executedPrice,
      executedAmount: response.executedAmount,
      fee: response.fee,
      baseCurrency: new CurrencyEntity({
        id: response.baseCurrencyId,
        decimal: response.baseCurrencyDecimal,
        symbol: response.baseCurrencySymbol,
        type: response.baseCurrencyType,
      }),
      quoteCurrency: new CurrencyEntity({
        id: response.quoteCurrencyId,
        decimal: response.quoteCurrencyDecimal,
        symbol: response.quoteCurrencySymbol,
        type: response.quoteCurrencyType,
      }),
      provider: new ProviderEntity({
        id: response.providerId,
        name: response.providerName,
      }),
    });
  }

  async getRemittanceById(
    request: GetRemittanceByIdServiceRequest,
  ): Promise<Remittance> {
    const remote = new GetRemittanceByIdRequest({
      id: request.id,
    });

    const response = await this.getRemittanceByIdService.execute(remote);

    if (!response) return null;

    return new RemittanceEntity({
      id: response.id,
      amount: response.amount,
      status: response.status,
      type: response.type,
      bankQuote: response.bankQuote,
      currency: new CurrencyEntity({
        id: response.currencyId,
      }),
      system: new SystemEntity({
        id: response.systemId,
      }),
      ...(response.providerId && {
        provider: new ProviderEntity({
          id: response.providerId,
        }),
      }),
    });
  }
}
