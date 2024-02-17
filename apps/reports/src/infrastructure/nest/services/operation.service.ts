import { Logger } from 'winston';
import {
  KafkaService,
  Pagination,
  PaginationResponse,
  TPaginationResponse,
} from '@zro/common';
import {
  LimitTypeEntity,
  TransactionType,
  TransactionTypeEntity,
  UserLimit,
  UserLimitEntity,
  Currency,
  CurrencyEntity,
  Operation,
  OperationEntity,
  TGetOperationsFilter,
  WalletAccount,
  WalletAccountEntity,
} from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';
import { OperationService } from '@zro/reports/application';
import {
  GetActiveTransactionTypeByTagServiceKafka,
  GetAllOperationsByFilterServiceKafka,
  GetCurrencyByTagServiceKafka,
  GetOperationByIdServiceKafka,
  GetUserLimitsByFilterServiceKafka,
  GetWalletAccountByUserAndCurrencyServiceKafka,
} from '@zro/operations/infrastructure';
import {
  GetAllOperationsByFilterRequest,
  GetCurrencyByTagRequest,
  GetWalletAccountByUserAndCurrencyRequest,
} from '@zro/operations/interface';

/**
 * Operation microservice
 */
export class OperationServiceKafka implements OperationService {
  static _services: any[] = [
    GetActiveTransactionTypeByTagServiceKafka,
    GetAllOperationsByFilterServiceKafka,
    GetCurrencyByTagServiceKafka,
    GetOperationByIdServiceKafka,
    GetUserLimitsByFilterServiceKafka,
    GetWalletAccountByUserAndCurrencyServiceKafka,
  ];

  private readonly getOperationByIdService: GetOperationByIdServiceKafka;
  private readonly getTransactionTypeByTagService: GetActiveTransactionTypeByTagServiceKafka;
  private readonly getCurrencyByTagService: GetCurrencyByTagServiceKafka;
  private readonly getUserLimitsByFilterService: GetUserLimitsByFilterServiceKafka;
  private readonly getWalletAccountByUserAndCurrencyService: GetWalletAccountByUserAndCurrencyServiceKafka;
  private readonly getAllOperationsByFilterService: GetAllOperationsByFilterServiceKafka;

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

    this.getTransactionTypeByTagService =
      new GetActiveTransactionTypeByTagServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.getCurrencyByTagService = new GetCurrencyByTagServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getUserLimitsByFilterService = new GetUserLimitsByFilterServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getCurrencyByTagService = new GetCurrencyByTagServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getWalletAccountByUserAndCurrencyService =
      new GetWalletAccountByUserAndCurrencyServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.getAllOperationsByFilterService =
      new GetAllOperationsByFilterServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  /**
   * Get operation by id service.
   * @param id Operation id.
   * @returns Get a operation by id response.
   */
  async getOperationById(id: string): Promise<Operation> {
    const result = await this.getOperationByIdService.execute({ id });
    const response = result && new OperationEntity(result);
    return response;
  }

  /**
   *  Get transaction type by tag.
   * @param tag transaction type tag.
   * @returns Transaction type found or null otherwise.
   */
  async getTransactionTypeByTag(tag: string): Promise<TransactionType> {
    const result = await this.getTransactionTypeByTagService.execute({ tag });

    const response = result && new TransactionTypeEntity(result);

    return response;
  }

  async getAllUserLimits(user: User): Promise<UserLimit[]> {
    const result = await this.getUserLimitsByFilterService.execute({
      userId: user.uuid,
    });

    const response = result.map(
      (item) =>
        new UserLimitEntity({
          id: item.id,
          limitType: new LimitTypeEntity({
            id: item.limitTypeId,
            tag: item.limitTypeTag,
            description: item.limitTypeDescription,
          }),
          dailyLimit: item.dailyLimit,
        }),
    );

    return response;
  }

  /**
   * Get currency by tag microservice.
   * @param tag The currency tag.
   * @returns Curency if found or null otherwise.
   */
  async getCurrencyByTag(tag: string): Promise<Currency> {
    const request: GetCurrencyByTagRequest = {
      tag,
    };

    const response = await this.getCurrencyByTagService.execute(request);

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
   * Get wallet account by user and currency.
   * @param user User.
   * @param currency Currency.
   * @returns Wallet account or null otherwise .
   */
  async getWalletAccountByUserAndCurrency(
    user: User,
    currency: Currency,
  ): Promise<WalletAccount> {
    const request = new GetWalletAccountByUserAndCurrencyRequest({
      userId: user.uuid,
      currencyTag: currency.tag,
    });

    const result =
      await this.getWalletAccountByUserAndCurrencyService.execute(request);

    const response = result && new WalletAccountEntity(result);

    return response;
  }

  /**
   * Get all operations by filter.
   * @param pagination Pagination.
   * @param filter Filter.
   * @returns The Operations found or null otherwise.
   */
  async getAllOperationsByFilter(
    pagination: Pagination,
    filter: TGetOperationsFilter,
  ): Promise<TPaginationResponse<Operation>> {
    const request: GetAllOperationsByFilterRequest = {
      ...pagination,
      ...filter,
    };

    const result = await this.getAllOperationsByFilterService.execute(request);

    const data = result?.data?.map(
      (operation) =>
        new OperationEntity({
          id: operation.id,
          fee: operation.fee,
          state: operation.state,
          description: operation.description,
          value: operation.value,
          createdAt: operation.createdAt,
          currency: new CurrencyEntity({
            id: operation.currencyId,
          }),
          transactionType: new TransactionTypeEntity({
            id: operation.transactionId,
            tag: operation.transactionTag,
          }),
          ...(operation.ownerWalletId && {
            ownerWalletAccount: new WalletAccountEntity({
              uuid: operation.ownerWalletId ?? null,
            }),
          }),
          ...(operation.beneficiaryWalletId && {
            beneficiaryWalletAccount: new WalletAccountEntity({
              uuid: operation.beneficiaryWalletId ?? null,
            }),
          }),
          ...(operation.operationRefId && {
            operationRef: new OperationEntity({
              id: operation.operationRefId ?? null,
            }),
          }),
          ...(operation.chargebackId && {
            chargeback: new OperationEntity({
              id: operation.chargebackId,
            }),
          }),
          ...(operation.ownerId && {
            owner: new UserEntity({
              uuid: operation.ownerId,
              document: operation.ownerDocument,
              type: operation.ownerType,
              name: operation.ownerName,
            }),
          }),
          ...(operation.beneficiaryId && {
            beneficiary: new UserEntity({
              uuid: operation.beneficiaryId,
              document: operation.beneficiaryDocument,
              type: operation.beneficiaryType,
              name: operation.beneficiaryName,
            }),
          }),
        }),
    );

    const response = new PaginationResponse<Operation>({
      ...result,
      data,
    });

    return response;
  }
}
