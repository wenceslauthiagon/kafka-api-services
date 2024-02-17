import { Logger } from 'winston';
import { IsOptional, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  CurrencyRepository,
  GlobalLimitRepository,
  LimitTypeRepository,
  OperationRepository,
  OperationStreamQuotationRepository,
  P2PTransferRepository,
  PendingWalletAccountTransactionRepository,
  TransactionTypeRepository,
  UserLimitRepository,
  UserLimitTrackerRepository,
  UserWalletRepository,
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
  CreateP2PTransferUseCase,
  DeleteWalletByUuidAndUserUseCase as UseCase,
} from '@zro/operations/application';
import {
  OperationEventEmitterController,
  OperationEventEmitterControllerInterface,
  UserLimitEventEmitterController,
  UserLimitEventEmitterControllerInterface,
} from '@zro/operations/interface';

type UserId = User['uuid'];
type WalletBackupId = Wallet['uuid'];

type TDeleteWalletByUuidAndUserRequest = Pick<Wallet, 'uuid'> & {
  userId: UserId;
  walletBackupId?: WalletBackupId;
};

export class DeleteWalletByUuidAndUserRequest
  extends AutoValidator
  implements TDeleteWalletByUuidAndUserRequest
{
  @IsUUID(4)
  uuid: string;

  @IsUUID(4)
  userId: UserId;

  @IsOptional()
  @IsUUID(4)
  walletBackupId?: WalletBackupId;

  constructor(props: TDeleteWalletByUuidAndUserRequest) {
    super(props);
  }
}

export class DeleteWalletByUuidAndUserController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Logger service.
   * @param walletRepository Wallet repository.
   */
  constructor(
    private logger: Logger,
    walletRepository: WalletRepository,
    walletAccountRepository: WalletAccountRepository,
    userWalletRepository: UserWalletRepository,
    p2pTransferRepository: P2PTransferRepository,
    transactionTypeRepository: TransactionTypeRepository,
    currencyRepository: CurrencyRepository,
    operationRepository: OperationRepository,
    limitTypeRepository: LimitTypeRepository,
    userLimitRepository: UserLimitRepository,
    globalLimitRepository: GlobalLimitRepository,
    walletAccountTransactionRepository: WalletAccountTransactionRepository,
    walletAccountCacheRepository: WalletAccountCacheRepository,
    operationStreamQuotationRepository: OperationStreamQuotationRepository,
    pendingWalletAccountTransactionRepository: PendingWalletAccountTransactionRepository,
    serviceEventEmitter: OperationEventEmitterControllerInterface,
    createP2PTransfertransactionTypeTag: string,
    operationSymbolCurrencyReal: string,
    pendingWalletAccountTransactionTTL: number,
    creditTransactionTypeTag: string,
    debitTransactionTypeTag: string,
    ZROWalletId: string,
    userLimitServiceEventEmitter: UserLimitEventEmitterControllerInterface,
    userLimitTrackerRepository: UserLimitTrackerRepository,
  ) {
    this.logger = logger.child({
      context: DeleteWalletByUuidAndUserController.name,
    });

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

    const createP2PTransfer = new CreateP2PTransferUseCase(
      this.logger,
      p2pTransferRepository,
      currencyRepository,
      createP2PTransfertransactionTypeTag,
      createOperation,
      acceptOperation,
      creditTransactionTypeTag,
      debitTransactionTypeTag,
      ZROWalletId,
    );

    this.usecase = new UseCase(
      this.logger,
      walletRepository,
      walletAccountRepository,
      walletAccountCacheRepository,
      userWalletRepository,
      createP2PTransfer,
    );
  }

  /**
   * Delete wallet by uuid and user.
   *
   * @param request Input data.
   */
  async execute(request: DeleteWalletByUuidAndUserRequest): Promise<void> {
    this.logger.debug('Delete wallet by uuid and user request.', { request });

    const { uuid, userId, walletBackupId } = request;

    const walletBackup =
      walletBackupId && new WalletEntity({ uuid: walletBackupId });

    const user = new UserEntity({ uuid: userId });

    await this.usecase.execute(uuid, user, walletBackup);

    this.logger.debug('Delete wallet by uuid and user response.');
  }
}
