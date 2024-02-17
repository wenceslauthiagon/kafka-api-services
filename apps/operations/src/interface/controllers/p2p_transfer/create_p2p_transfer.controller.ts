import { Logger } from 'winston';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  Currency,
  CurrencyEntity,
  CurrencyRepository,
  GlobalLimitRepository,
  LimitTypeRepository,
  Operation,
  OperationRepository,
  OperationStreamQuotationRepository,
  P2PTransfer,
  P2PTransferRepository,
  PendingWalletAccountTransactionRepository,
  TransactionTypeRepository,
  UserLimitRepository,
  UserLimitTrackerRepository,
  Wallet,
  WalletAccountCacheRepository,
  WalletAccountRepository,
  WalletAccountTransactionRepository,
  WalletEntity,
  WalletRepository,
} from '@zro/operations/domain';
import {
  AcceptOperationUseCase,
  CreateOperationUseCase,
  CreateP2PTransferUseCase as UseCase,
} from '@zro/operations/application';
import {
  OperationEventEmitterController,
  OperationEventEmitterControllerInterface,
  UserLimitEventEmitterController,
  UserLimitEventEmitterControllerInterface,
} from '@zro/operations/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];
type CurrencySymbol = Currency['symbol'];

type TCreateP2PTransferRequest = {
  id: string;
  userId: UserId;
  walletId: WalletId;
  beneficiaryWalletId: WalletId;
  amountCurrencySymbol: CurrencySymbol;
  amount: number;
  fee?: number;
  description?: string;
};

export class CreateP2PTransferRequest
  extends AutoValidator
  implements TCreateP2PTransferRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  @IsUUID(4)
  beneficiaryWalletId: WalletId;

  @IsString()
  @Length(1, 255)
  amountCurrencySymbol: CurrencySymbol;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsInt()
  @IsOptional()
  fee?: number;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  description?: string;

  constructor(props: TCreateP2PTransferRequest) {
    super(props);
  }
}

type TCreateP2PTransferResponse = Pick<
  P2PTransfer,
  'id' | 'amount' | 'description' | 'fee' | 'createdAt'
> & {
  operationId: OperationId;
  amountCurrencySymbol: CurrencySymbol;
};

export class CreateP2PTransferResponse
  extends AutoValidator
  implements TCreateP2PTransferResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  operationId: OperationId;

  @IsString()
  @Length(1, 255)
  amountCurrencySymbol: CurrencySymbol;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsInt()
  fee: number;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  description?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TCreateP2PTransferResponse) {
    super(props);
  }
}

export class CreateP2PTransferController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Logger service.
   * @param p2pTransferRepository P2PTransfer repository.
   */
  constructor(
    private logger: Logger,
    p2pTransferRepository: P2PTransferRepository,
    transactionTypeRepository: TransactionTypeRepository,
    currencyRepository: CurrencyRepository,
    walletRepository: WalletRepository,
    walletAccountRepository: WalletAccountRepository,
    operationRepository: OperationRepository,
    limitTypeRepository: LimitTypeRepository,
    userLimitRepository: UserLimitRepository,
    globalLimitRepository: GlobalLimitRepository,
    walletAccountTransactionRepository: WalletAccountTransactionRepository,
    walletAccountCacheRepository: WalletAccountCacheRepository,
    operationStreamQuotationRepository: OperationStreamQuotationRepository,
    pendingWalletAccountTransactionRepository: PendingWalletAccountTransactionRepository,
    serviceEventEmitter: OperationEventEmitterControllerInterface,
    createP2PTransferTransactionTypeTag: string,
    operationSymbolCurrencyReal: string,
    pendingWalletAccountTransactionTTL: number,
    creditTransactionTypeTag: string,
    debitTransactionTypeTag: string,
    ZROWalletId: string,
    userLimitServiceEventEmitter: UserLimitEventEmitterControllerInterface,
    userLimitTrackerRepository: UserLimitTrackerRepository,
  ) {
    this.logger = logger.child({ context: CreateP2PTransferController.name });

    const eventEmitter = new OperationEventEmitterController(
      serviceEventEmitter,
    );

    const userLimitEventEmitter = new UserLimitEventEmitterController(
      userLimitServiceEventEmitter,
    );

    const createOperation = new CreateOperationUseCase(
      this.logger,
      transactionTypeRepository,
      currencyRepository,
      walletRepository,
      walletAccountRepository,
      operationRepository,
      limitTypeRepository,
      userLimitRepository,
      globalLimitRepository,
      walletAccountCacheRepository,
      operationStreamQuotationRepository,
      pendingWalletAccountTransactionRepository,
      eventEmitter,
      operationSymbolCurrencyReal,
      pendingWalletAccountTransactionTTL,
      userLimitEventEmitter,
      userLimitTrackerRepository,
    );

    const acceptOperation = new AcceptOperationUseCase(
      this.logger,
      operationRepository,
      walletAccountRepository,
      walletAccountTransactionRepository,
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      p2pTransferRepository,
      currencyRepository,
      createP2PTransferTransactionTypeTag,
      createOperation,
      acceptOperation,
      creditTransactionTypeTag,
      debitTransactionTypeTag,
      ZROWalletId,
    );
  }

  /**
   * Create P2P transfer.
   *
   * @param request Input data.
   * @returns Wallet if found or null otherwise.
   */
  async execute(
    request: CreateP2PTransferRequest,
  ): Promise<CreateP2PTransferResponse> {
    this.logger.debug('Create P2P transfer request.', { request });

    const {
      id,
      userId,
      walletId,
      beneficiaryWalletId,
      amountCurrencySymbol,
      amount,
      fee,
      description,
    } = request;

    const user = new UserEntity({ uuid: userId });
    const wallet = new WalletEntity({ uuid: walletId });
    const beneficiaryWallet = new WalletEntity({ uuid: beneficiaryWalletId });
    const currency = new CurrencyEntity({ symbol: amountCurrencySymbol });

    const result = await this.usecase.execute(
      id,
      user,
      wallet,
      beneficiaryWallet,
      currency,
      amount,
      fee,
      description,
    );

    const response = new CreateP2PTransferResponse({
      id: result.id,
      operationId: result.operation.id,
      amountCurrencySymbol: result.currency.symbol,
      amount: result.amount,
      fee: result.fee,
      description: result.description,
      createdAt: result.createdAt,
    });

    this.logger.debug('Create P2P transfer response.', { response });

    return response;
  }
}
