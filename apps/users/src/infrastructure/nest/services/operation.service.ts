import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import {
  Currency,
  CurrencyEntity,
  Operation,
  OperationEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';
import { OperationService } from '@zro/users/application';
import {
  GetCurrencyByIdRequest,
  GetCurrencyBySymbolRequest,
  GetOperationByIdRequest,
  GetWalletByUserAndDefaultIsTrueRequest,
  GetWalletByUuidRequest,
} from '@zro/operations/interface';
import {
  GetCurrencyBySymbolServiceKafka,
  GetCurrencyByIdServiceKafka,
  GetOperationByIdServiceKafka,
  GetWalletByUserAndDefaultIsTrueServiceKafka,
  GetWalletByUuidServiceKafka,
} from '@zro/operations/infrastructure';

/**
 * Operation microservice
 */
export class OperationServiceKafka implements OperationService {
  static _services: any[] = [
    GetCurrencyBySymbolServiceKafka,
    GetCurrencyByIdServiceKafka,
    GetOperationByIdServiceKafka,
    GetWalletByUserAndDefaultIsTrueServiceKafka,
    GetWalletByUuidServiceKafka,
  ];

  private readonly getOperationByIdService: GetOperationByIdServiceKafka;
  private readonly getCurrencyByIdService: GetCurrencyByIdServiceKafka;
  private readonly getCurrencyBySymbolService: GetCurrencyBySymbolServiceKafka;
  private readonly getWalletByUserAndDefaultIsTrueService: GetWalletByUserAndDefaultIsTrueServiceKafka;
  private readonly getWalletByUuidService: GetWalletByUuidServiceKafka;

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
    this.logger = logger.child({ context: OperationServiceKafka.name });

    this.getOperationByIdService = new GetOperationByIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getCurrencyByIdService = new GetCurrencyByIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getCurrencyBySymbolService = new GetCurrencyBySymbolServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getWalletByUserAndDefaultIsTrueService =
      new GetWalletByUserAndDefaultIsTrueServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.getWalletByUuidService = new GetWalletByUuidServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  async getOperationById(operation: Operation): Promise<Operation> {
    const request: GetOperationByIdRequest = {
      id: operation.id,
    };

    const response = await this.getOperationByIdService.execute(request);

    if (!response) return null;

    return new OperationEntity({
      id: response.id,
      value: response.value,
      state: response.state,
    });
  }

  /**
   * Get Currency by id.
   * @param currency The currency.
   * @returns Currency if found or null otherwise.
   */
  async getCurrencyById(currency: Currency): Promise<Currency> {
    const request: GetCurrencyByIdRequest = {
      id: currency.id,
    };

    const response = await this.getCurrencyByIdService.execute(request);

    if (!response) return null;

    return new CurrencyEntity({
      id: response.id,
      title: response.title,
      symbol: response.symbol,
      symbolAlign: response.symbolAlign,
      tag: response.tag,
      type: response.type,
      decimal: response.decimal,
      state: response.state,
    });
  }

  /**
   * Get Currency by symbol.
   * @param symbol The currency symbol.
   * @returns Currency if found or null otherwise.
   */
  async getCurrencyBySymbol(symbol: string): Promise<Currency> {
    const request: GetCurrencyBySymbolRequest = {
      symbol,
    };

    const response = await this.getCurrencyBySymbolService.execute(request);

    if (!response) return null;

    return new CurrencyEntity({
      id: response.id,
      title: response.title,
      symbol: response.symbol,
      symbolAlign: response.symbolAlign,
      tag: response.tag,
      type: response.type,
      decimal: response.decimal,
      state: response.state,
    });
  }

  async getWalletByUserAndDefaultIsTrue(user: User): Promise<Wallet> {
    const request: GetWalletByUserAndDefaultIsTrueRequest = {
      userId: user.uuid,
    };

    const response =
      await this.getWalletByUserAndDefaultIsTrueService.execute(request);

    if (!response) return null;

    return new WalletEntity({
      uuid: response.uuid,
      user: new UserEntity({ uuid: response.userId }),
      state: response.state,
    });
  }

  async getWalletByUuid(walletUuid: string): Promise<Wallet> {
    const request: GetWalletByUuidRequest = { uuid: walletUuid };

    const response = await this.getWalletByUuidService.execute(request);

    if (!response) return null;

    return new WalletEntity({
      id: response.id,
      uuid: response.uuid,
      state: response.state,
      default: response.default,
      user: response.user,
    });
  }
}
