import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  Currency,
  CurrencyEntity,
  CurrencyState,
  LimitType,
  LimitTypeEntity,
  Operation,
  UserLimit,
  UserLimitEntity,
  Wallet,
  WalletAccount,
  WalletAccountEntity,
  WalletEntity,
} from '@zro/operations/domain';
import { OperationService } from '@zro/otc/application';
import {
  GetCurrencyByTagServiceKafka,
  CreateCurrencyServiceKafka,
  GetCurrencyBySymbolServiceKafka,
  CreateOperationServiceKafka,
  AcceptOperationServiceKafka,
  CreateAndAcceptOperationServiceKafka,
  GetWalletAccountByWalletAndCurrencyServiceKafka,
  GetAllCurrencyServiceKafka,
  GetLimitTypesByFilterServiceKafka,
  GetUserLimitsByFilterServiceKafka,
  GetCurrencyByIdServiceKafka,
  GetAllWalletByUserServiceKafka,
  GetWalletByUserAndDefaultIsTrueServiceKafka,
} from '@zro/operations/infrastructure';
import {
  AcceptOperationRequest,
  AcceptOperationResponse,
  CreateAndAcceptOperationRequest,
  CreateAndAcceptOperationResponse,
  CreateCurrencyRequest,
  CreateOperationRequest,
  CreateOperationResponse,
  GetAllCurrencyRequest,
  GetAllCurrencyRequestSort,
  GetAllWalletByUserRequest,
  GetCurrencyByIdRequest,
  GetCurrencyBySymbolRequest,
  GetCurrencyByTagRequest,
  GetLimitTypesByFilterRequest,
  GetUserLimitsByFilterRequest,
  GetWalletAccountByWalletAndCurrencyRequest,
  GetWalletByUserAndDefaultIsTrueRequest,
  UserInfoRequest,
} from '@zro/operations/interface';

/**
 * Operation microservice
 */
export class OperationServiceKafka implements OperationService {
  static _services: any[] = [
    GetCurrencyByTagServiceKafka,
    CreateCurrencyServiceKafka,
    GetCurrencyBySymbolServiceKafka,
    CreateOperationServiceKafka,
    AcceptOperationServiceKafka,
    CreateAndAcceptOperationServiceKafka,
    GetWalletAccountByWalletAndCurrencyServiceKafka,
    GetAllCurrencyServiceKafka,
    GetLimitTypesByFilterServiceKafka,
    GetUserLimitsByFilterServiceKafka,
    GetCurrencyByIdServiceKafka,
    GetAllWalletByUserServiceKafka,
    GetWalletByUserAndDefaultIsTrueServiceKafka,
  ];

  private readonly getAllCurrencyService: GetAllCurrencyServiceKafka;
  private readonly getCurrencyByTagService: GetCurrencyByTagServiceKafka;
  private readonly getCurrencyBySymbolService: GetCurrencyBySymbolServiceKafka;
  private readonly createCurrencyService: CreateCurrencyServiceKafka;
  private readonly createOperationService: CreateOperationServiceKafka;
  private readonly acceptOperationService: AcceptOperationServiceKafka;
  private readonly createAndAcceptOperationService: CreateAndAcceptOperationServiceKafka;
  private readonly getWalletAccountByWalletAndCurrencyService: GetWalletAccountByWalletAndCurrencyServiceKafka;
  private readonly getLimitTypesByFilterService: GetLimitTypesByFilterServiceKafka;
  private readonly getUserLimitsByFilterService: GetUserLimitsByFilterServiceKafka;
  private readonly getCurrencyByIdService: GetCurrencyByIdServiceKafka;
  private readonly getWalletsByUserSerice: GetAllWalletByUserServiceKafka;
  private readonly getWalletByUserAndDefaultIsTrueService: GetWalletByUserAndDefaultIsTrueServiceKafka;

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

    this.getAllCurrencyService = new GetAllCurrencyServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getCurrencyByTagService = new GetCurrencyByTagServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getCurrencyBySymbolService = new GetCurrencyBySymbolServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.createCurrencyService = new CreateCurrencyServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.createOperationService = new CreateOperationServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.acceptOperationService = new AcceptOperationServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.createAndAcceptOperationService =
      new CreateAndAcceptOperationServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.getWalletAccountByWalletAndCurrencyService =
      new GetWalletAccountByWalletAndCurrencyServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.getLimitTypesByFilterService = new GetLimitTypesByFilterServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getUserLimitsByFilterService = new GetUserLimitsByFilterServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getCurrencyByIdService = new GetCurrencyByIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getWalletsByUserSerice = new GetAllWalletByUserServiceKafka(
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
  }

  async getAllActiveCurrencies(): Promise<Currency[]> {
    const getAllCurrencyService = this.getAllCurrencyService;
    const currencies: Currency[] = [];

    const getAllCurrenciesIterable = {
      [Symbol.asyncIterator]() {
        return {
          i: 1,
          total: 0,
          async next() {
            // Get only active currencies
            const getAllCurrencyServiceRequest = new GetAllCurrencyRequest({
              state: CurrencyState.ACTIVE,
              sort: GetAllCurrencyRequestSort.ID,
              page: this.i++,
              pageSize: 100,
            });

            // Get an page of currencies.
            const pageCurrencies = await getAllCurrencyService.execute(
              getAllCurrencyServiceRequest,
            );

            // Remember how many currencies were loaded.
            this.total += pageCurrencies.pageTotal;

            return {
              value: pageCurrencies,
              done: !pageCurrencies.data?.length,
            };
          },
        };
      },
    };

    // Iterate over all gotten pages.
    for await (const pageCurrencies of getAllCurrenciesIterable) {
      pageCurrencies.data.forEach((item) =>
        currencies.push(new CurrencyEntity(item)),
      );
    }

    return currencies;
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
   * Insert a Currency.
   * @param currency Currency to save.
   * @returns Created currency.
   */
  async createCurrency(currency: Currency): Promise<Currency> {
    const request: CreateCurrencyRequest = {
      title: currency.title,
      symbol: currency.symbol,
      symbolAlign: currency.symbolAlign,
      tag: currency.tag,
      type: currency.type,
      decimal: currency.decimal,
      state: currency.state,
    };

    const response = await this.createCurrencyService.execute(request);

    if (!response) return null;

    return new CurrencyEntity({
      id: response.id,
      title: response.title,
      symbol: response.symbol,
      symbolAlign: response.symbolAlign,
      tag: response.tag,
      decimal: response.decimal,
      state: response.state,
    });
  }

  /**
   * Get Currency by symbol.
   * @param symbol The Currency's symbol.
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

  /**
   * Create operation in microservice.
   * @param transactionTag String for construct operation.
   * @param operation The key.
   * @returns Created operation.
   */
  async createOperation(
    transactionTag: string,
    operation: Operation,
    ownerWallet?: Wallet,
    beneficiaryWallet?: Wallet,
  ): Promise<CreateOperationResponse> {
    let beneficiary: UserInfoRequest;
    let owner: UserInfoRequest;

    if (ownerWallet)
      owner = {
        walletId: ownerWallet.uuid,
        operationId: operation.id,
        currencyTag: operation.currency.tag,
        rawValue: operation.rawValue,
        description: operation.description,
        fee: operation.fee ?? 0,
      };

    if (beneficiaryWallet)
      beneficiary = {
        walletId: beneficiaryWallet.uuid,
        operationId: operation.id,
        currencyTag: operation.currency.tag,
        rawValue: operation.rawValue,
        description: operation.description,
        fee: operation.fee ?? 0,
      };

    const request: CreateOperationRequest = {
      owner,
      beneficiary,
      transactionTag,
    };

    return this.createOperationService.execute(request);
  }

  /**
   * Accept operation in microservice.
   * @param operation The operation.
   * @returns Accepted operation.
   */
  async acceptOperation(
    operation: Operation,
  ): Promise<AcceptOperationResponse> {
    const request: AcceptOperationRequest = {
      id: operation.id,
    };

    return this.acceptOperationService.execute(request);
  }

  /**
   * Create ond accept peration.
   * @param transactionTag String for construct operation.
   * @param operationOwner Data for construct operation.
   * @param operationBeneficiary Data for construct operation.
   * @returns Operation created.
   */
  createAndAcceptOperation(
    transactionTag: string,
    operationOwner: Operation,
    operationBeneficiary: Operation,
    ownerWallet?: Wallet,
    beneficiaryWallet?: Wallet,
  ): Promise<CreateAndAcceptOperationResponse> {
    let beneficiary: UserInfoRequest;
    let owner: UserInfoRequest;

    if (ownerWallet)
      owner = {
        walletId: ownerWallet.uuid,
        operationId: operationOwner.id,
        currencyTag: operationOwner.currency.tag,
        rawValue: operationOwner.rawValue,
        description: operationOwner.description,
        fee: operationOwner.fee ?? 0,
      };

    if (beneficiaryWallet)
      beneficiary = {
        walletId: beneficiaryWallet.uuid,
        operationId: operationBeneficiary.id,
        currencyTag: operationBeneficiary.currency.tag,
        rawValue: operationBeneficiary.rawValue,
        description: operationBeneficiary.description,
        fee: operationBeneficiary.fee ?? 0,
      };

    const request: CreateAndAcceptOperationRequest = {
      owner,
      beneficiary,
      transactionTag,
    };

    return this.createAndAcceptOperationService.execute(request);
  }

  /**
   * Get wallet account in microservice.
   * @param wallet Data for construct param.
   * @param currency Data for construct param.
   * @returns Wallet Account.
   */
  async getWalletAccountByWalletAndCurrency(
    wallet: Wallet,
    currency: Currency,
  ): Promise<WalletAccount> {
    const request: GetWalletAccountByWalletAndCurrencyRequest = {
      walletId: wallet.uuid,
      currencyTag: currency.tag,
    };

    const response =
      await this.getWalletAccountByWalletAndCurrencyService.execute(request);

    if (!response) return null;

    return new WalletAccountEntity({
      id: response.id,
      balance: response.balance,
      pendingAmount: response.pendingAmount,
      wallet: new WalletEntity({ uuid: response.walletId }),
      currency: new CurrencyEntity({ id: response.currencyId }),
      accountNumber: response.accountNumber,
      branchNumber: response.branchNumber,
      state: response.state,
    });
  }

  /**
   * Get Limit types in microservice.
   * @param transactionTypeTag Data for construct param.
   * @returns Limits Types.
   */
  async getLimitTypesByFilter(
    transactionTypeTag: string,
  ): Promise<LimitType[]> {
    const request: GetLimitTypesByFilterRequest = { transactionTypeTag };

    const limitTypes = await this.getLimitTypesByFilterService.execute(request);

    const response = limitTypes.data.map(
      (limitType) =>
        new LimitTypeEntity({
          id: limitType.id,
          tag: limitType.tag,
        }),
    );

    return response;
  }

  /**
   * Get User Limit in microservice.
   * @param limitType Limit type.
   * @param user User.
   * @returns Users Limits.
   */
  async getUserLimitsByFilter(
    limitType: LimitType,
    user: User,
  ): Promise<UserLimit[]> {
    const request: GetUserLimitsByFilterRequest = {
      userId: user.uuid,
      limitTypeId: limitType.id,
    };

    const userLimits = await this.getUserLimitsByFilterService.execute(request);

    const response = userLimits.map(
      (userLimit) =>
        new UserLimitEntity({
          id: userLimit.id,
          creditBalance: userLimit.creditBalance,
        }),
    );

    return response;
  }

  /**
   * Get Currency by id.
   * @param id The Currency's id.
   * @returns Currency if found or null otherwise.
   */
  async getCurrencyById(id: number): Promise<Currency> {
    const request: GetCurrencyByIdRequest = {
      id,
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
   * Get wallets by user.
   * @param user User.
   * @returns Wallets
   */
  async getWalletsByUser(user: User): Promise<Wallet[]> {
    const request: GetAllWalletByUserRequest = {
      userId: user.uuid,
    };

    const response = await this.getWalletsByUserSerice.execute(request);

    return response.map((wallet) => new WalletEntity(wallet));
  }

  /**
   * Get default wallet by user.
   * @param user User.
   * @returns Wallets
   */
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
}
