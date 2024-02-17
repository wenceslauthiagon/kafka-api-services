import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
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
import { OperationService } from '@zro/pix-payments/application';
import {
  CreateOperationServiceKafka,
  AcceptOperationServiceKafka,
  RevertOperationServiceKafka,
  GetOperationByIdServiceKafka,
  GetWalletAccountByAccountNumberAndCurrencyServiceKafka,
  GetWalletAccountByWalletAndCurrencyServiceKafka,
  SetOperationReferenceByIdServiceKafka,
  CreateAndAcceptOperationServiceKafka,
  GetWalletByUserAndDefaultIsTrueServiceKafka,
} from '@zro/operations/infrastructure';
import {
  AcceptOperationRequest,
  AcceptOperationResponse,
  CreateOperationResponse,
  GetWalletAccountByWalletAndCurrencyRequest,
  RevertOperationRequest,
  RevertOperationResponse,
  GetWalletAccountByAccountNumberAndCurrencyRequest,
  UserInfoRequest,
  GetOperationByIdRequest,
  SetOperationReferenceByIdResponse,
  SetOperationReferenceByIdRequest,
  CreateAndAcceptOperationRequest,
  CreateAndAcceptOperationResponse,
  GetWalletByUserAndDefaultIsTrueRequest,
  CreateOperationRequest,
} from '@zro/operations/interface';

/**
 * Operations microservice
 */
export class OperationServiceKafka implements OperationService {
  static _services: any[] = [
    CreateOperationServiceKafka,
    AcceptOperationServiceKafka,
    RevertOperationServiceKafka,
    GetOperationByIdServiceKafka,
    GetWalletAccountByAccountNumberAndCurrencyServiceKafka,
    GetWalletAccountByWalletAndCurrencyServiceKafka,
    SetOperationReferenceByIdServiceKafka,
    CreateAndAcceptOperationServiceKafka,
    GetWalletByUserAndDefaultIsTrueServiceKafka,
  ];

  private readonly createOperationService: CreateOperationServiceKafka;
  private readonly acceptOperationService: AcceptOperationServiceKafka;
  private readonly createAndAcceptOperationService: CreateAndAcceptOperationServiceKafka;
  private readonly revertOperationService: RevertOperationServiceKafka;
  private readonly getOperationByIdService: GetOperationByIdServiceKafka;
  private readonly getWalletAccountByAccountNumberAndCurrencyService: GetWalletAccountByAccountNumberAndCurrencyServiceKafka;
  private readonly getWalletAccountByWalletAndCurrencyService: GetWalletAccountByWalletAndCurrencyServiceKafka;
  private readonly getWalletByUserAndDefaultIsTrueService: GetWalletByUserAndDefaultIsTrueServiceKafka;
  private readonly setOperationReferenceByIdService: SetOperationReferenceByIdServiceKafka;

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

    this.setOperationReferenceByIdService =
      new SetOperationReferenceByIdServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  /**
   * Create operation in microservice.
   * @param operation The key.
   * @param transactionTag String for construct operation.
   * @returns Created operation.
   */
  async createOperation(
    transactionTag: string,
    operation: Operation,
    ownerWallet?: Wallet,
    beneficiaryWallet?: Wallet,
    ownerAllowAvailableRawValue = false,
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
        ownerAllowAvailableRawValue,
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
   * @param operation Data for construct operation.
   * @param transactionTag String for construct operation.
   * @returns Operation created.
   */
  createAndAcceptOperation(
    transactionTag: string,
    operation: Operation,
    ownerWallet?: Wallet,
    beneficiaryWallet?: Wallet,
    ownerAllowAvailableRawValue?: boolean,
  ): Promise<CreateAndAcceptOperationResponse> {
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
        ownerAllowAvailableRawValue,
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

    return this.createAndAcceptOperationService.execute(request);
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

  /**
   * Get wallet account in microservice.
   * @param user Data for construct param.
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
    const result =
      await this.getWalletAccountByWalletAndCurrencyService.execute(request);
    const response = result && new WalletAccountEntity(result);
    return response;
  }

  /**
   * Revert operation in microservice.
   * @param operation The operation.
   * @returns Operation reverted.
   */
  async revertOperation(
    operation: Operation,
  ): Promise<RevertOperationResponse> {
    const request: RevertOperationRequest = {
      id: operation.id,
    };

    return this.revertOperationService.execute(request);
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
   * Set operation reference in microservice.
   * @param operationFisrt The operation.
   * @param operationSecond The operation.
   * @returns The referenced operations.
   */
  async setOperationReference(
    operationFisrt: Operation,
    operationSecond: Operation,
  ): Promise<SetOperationReferenceByIdResponse> {
    const request: SetOperationReferenceByIdRequest = {
      operationIdFirst: operationFisrt.id,
      operationIdSecond: operationSecond.id,
    };

    return this.setOperationReferenceByIdService.execute(request);
  }
}
