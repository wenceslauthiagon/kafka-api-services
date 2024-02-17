import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import {
  Currency,
  CurrencyEntity,
  Operation,
  OperationEntity,
  Wallet,
  WalletAccount,
  WalletAccountEntity,
  WalletEntity,
} from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';
import { OperationService } from '@zro/banking/application';
import {
  GetWalletAccountByWalletAndCurrencyServiceKafka,
  CreateAndAcceptOperationServiceKafka,
  GetWalletAccountByAccountNumberAndCurrencyServiceKafka,
  RevertOperationServiceKafka,
  GetOperationByIdServiceKafka,
  GetWalletByUserAndDefaultIsTrueServiceKafka,
} from '@zro/operations/infrastructure';
import {
  GetWalletAccountByWalletAndCurrencyRequest,
  UserInfoRequest,
  CreateAndAcceptOperationRequest,
  GetWalletAccountByAccountNumberAndCurrencyRequest,
  RevertOperationRequest,
  GetOperationByIdRequest,
  GetWalletByUserAndDefaultIsTrueRequest,
} from '@zro/operations/interface';

/**
 * Operations microservice
 */
export class OperationServiceKafka implements OperationService {
  static _services: any[] = [
    GetWalletAccountByWalletAndCurrencyServiceKafka,
    CreateAndAcceptOperationServiceKafka,
    GetWalletAccountByAccountNumberAndCurrencyServiceKafka,
    RevertOperationServiceKafka,
    GetOperationByIdServiceKafka,
    GetWalletByUserAndDefaultIsTrueServiceKafka,
  ];

  private readonly createAndAcceptOperationService: CreateAndAcceptOperationServiceKafka;
  private readonly getWalletAccountByWalletAndCurrencyService: GetWalletAccountByWalletAndCurrencyServiceKafka;
  private readonly getWalletAccountByAccountNumberAndCurrencyService: GetWalletAccountByAccountNumberAndCurrencyServiceKafka;
  private readonly getWalletByUserAndDefaultIsTrueService: GetWalletByUserAndDefaultIsTrueServiceKafka;
  private readonly revertOperationService: RevertOperationServiceKafka;
  private readonly getOperationByIdService: GetOperationByIdServiceKafka;

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

    this.getWalletAccountByAccountNumberAndCurrencyService =
      new GetWalletAccountByAccountNumberAndCurrencyServiceKafka(
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

    this.revertOperationService = new RevertOperationServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getOperationByIdService = new GetOperationByIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Create and accept operation.
   * @param transactionTag String for construct operation.
   * @param operation Data for construct operation.
   * @returns Operation created.
   */
  async createAndAcceptOperation(
    transactionTag: string,
    operation: Operation,
    ownerWallet?: Wallet,
    beneficiaryWallet?: Wallet,
  ): Promise<void> {
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

    const request: CreateAndAcceptOperationRequest = {
      owner,
      beneficiary,
      transactionTag,
    };

    await this.createAndAcceptOperationService.execute(request);
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

    const walletAccount = new WalletAccountEntity({
      id: response.id,
      balance: response.balance,
      pendingAmount: response.pendingAmount,
      wallet: new WalletEntity({ uuid: response.walletId }),
      currency: new CurrencyEntity({ id: response.currencyId }),
      accountNumber: response.accountNumber,
      branchNumber: response.branchNumber,
      state: response.state,
    });

    return walletAccount;
  }

  /**
   * Get account number and currency wallet account in microservice.
   * @param accountNumber The account number.
   * @param currency Data for construct param.
   * @returns The wallet account and account number.
   */
  async getWalletAccountByAccountNumberAndCurrency(
    accountNumber: string,
    currency: Currency,
  ): Promise<WalletAccount> {
    const request: GetWalletAccountByAccountNumberAndCurrencyRequest = {
      accountNumber,
      currencyTag: currency.tag,
    };

    const response =
      await this.getWalletAccountByAccountNumberAndCurrencyService.execute(
        request,
      );

    if (!response) return null;

    return new WalletAccountEntity({
      id: response.id,
      wallet: new WalletEntity({
        uuid: response.walletId,
        user: new UserEntity({ uuid: response.userId }),
      }),
      currency: new CurrencyEntity({ id: response.currencyId }),
      accountNumber: response.accountNumber,
      branchNumber: response.branchNumber,
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

  /**
   * Revert operation in microservice.
   * @param operation The operation.
   * @returns Operation reverted.
   */
  async revertOperation(operation: Operation): Promise<void> {
    const request: RevertOperationRequest = {
      id: operation.id,
    };

    await this.revertOperationService.execute(request);
  }

  /**
   * Get operation by id in microservice.
   * @param id The operation's id.
   * @returns The operation.
   */
  async getOperationById(id: string): Promise<Operation> {
    const request: GetOperationByIdRequest = { id };
    const result = await this.getOperationByIdService.execute(request);
    const response = result && new OperationEntity(result);
    return response;
  }
}
