import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { method, On } from 'ts-auto-mock/extension';
import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger, RedisService } from '@zro/common';
import { WalletAccountState, WalletState } from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import {
  WalletNotFoundException,
  WalletCannotBeDeletedException,
  WalletAccountHasBalanceException,
  WalletNotActiveException,
} from '@zro/operations/application';
import {
  DeleteWalletByUuidAndUserMicroserviceController as Controller,
  UserWalletDatabaseRepository,
  WalletAccountDatabaseRepository,
  WalletDatabaseRepository,
  WalletModel,
  P2PTransferDatabaseRepository,
  TransactionTypeDatabaseRepository,
  CurrencyDatabaseRepository,
  OperationDatabaseRepository,
  LimitTypeDatabaseRepository,
  UserLimitDatabaseRepository,
  GlobalLimitDatabaseRepository,
  WalletAccountTransactionDatabaseRepository,
  WalletAccountCacheDatabaseRepository,
  WalletAccountModel,
  UserLimitTrackerDatabaseRepository,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import {
  DeleteWalletByUuidAndUserRequest,
  OperationEventEmitterControllerInterface,
  UserLimitEventEmitterControllerInterface,
} from '@zro/operations/interface';
import { UserFactory } from '@zro/test/users/config';
import {
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';

describe('DeleteWalletByUuidAndUserMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  const walletRepository = new WalletDatabaseRepository();
  const walletAccountRepository = new WalletAccountDatabaseRepository();
  const userWalletRepository = new UserWalletDatabaseRepository();
  const p2pTransferRepository = new P2PTransferDatabaseRepository();
  const transactionTypeRepository = new TransactionTypeDatabaseRepository();
  const currencyRepository = new CurrencyDatabaseRepository();
  const operationRepository = new OperationDatabaseRepository();
  const limitTypeRepository = new LimitTypeDatabaseRepository();
  const userLimitRepository = new UserLimitDatabaseRepository();
  const globalLimitRepository = new GlobalLimitDatabaseRepository();
  const walletAccountTransactionRepository =
    new WalletAccountTransactionDatabaseRepository();
  const walletAccountCacheRepository =
    new WalletAccountCacheDatabaseRepository();
  const userLimitTrackerRepository = new UserLimitTrackerDatabaseRepository();

  const operationEventEmitter: OperationEventEmitterControllerInterface =
    createMock<OperationEventEmitterControllerInterface>();
  const mockEmitOperationEventEmitter: jest.Mock = On(
    operationEventEmitter,
  ).get(method((mock) => mock.emitOperationEvent));

  const userLimitEventEmitter: UserLimitEventEmitterControllerInterface =
    createMock<UserLimitEventEmitterControllerInterface>();

  const redisService: RedisService = createMock<RedisService>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(RedisService)
      .useValue(redisService)
      .compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('DeleteWalletByUuidAndUser', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should delete wallet by uuid and user successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name, {});

        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
          {
            userUUID: user.uuid,
            state: WalletState.ACTIVE,
            default: false,
          },
        );

        const message: DeleteWalletByUuidAndUserRequest = {
          uuid: wallet.uuid,
          userId: user.uuid,
        };

        const result = await controller.execute(
          walletAccountRepository,
          walletRepository,
          userWalletRepository,
          p2pTransferRepository,
          transactionTypeRepository,
          currencyRepository,
          operationRepository,
          limitTypeRepository,
          userLimitRepository,
          globalLimitRepository,
          walletAccountTransactionRepository,
          walletAccountCacheRepository,
          operationEventEmitter,
          userLimitEventEmitter,
          userLimitTrackerRepository,
          logger,
          message,
        );

        expect(result).toBeUndefined();
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0002 - Should return wallet when is deactivate', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name, {});

        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
          {
            userUUID: user.uuid,
            state: WalletState.DEACTIVATE,
            default: false,
          },
        );

        const message: DeleteWalletByUuidAndUserRequest = {
          uuid: wallet.uuid,
          userId: user.uuid,
        };

        const result = await controller.execute(
          walletAccountRepository,
          walletRepository,
          userWalletRepository,
          p2pTransferRepository,
          transactionTypeRepository,
          currencyRepository,
          operationRepository,
          limitTypeRepository,
          userLimitRepository,
          globalLimitRepository,
          walletAccountTransactionRepository,
          walletAccountCacheRepository,
          operationEventEmitter,
          userLimitEventEmitter,
          userLimitTrackerRepository,
          logger,
          message,
        );

        expect(result).toBeUndefined();
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should delete wallet by uuid and user with balance successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name, {});

        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
          {
            userUUID: user.uuid,
            state: WalletState.ACTIVE,
            default: false,
          },
        );

        const walletAccount =
          await WalletAccountFactory.create<WalletAccountModel>(
            WalletAccountModel.name,
            {
              walletUUID: wallet.uuid,
              balance: 1000,
              state: WalletAccountState.ACTIVE,
            },
          );

        const walletBackup = await WalletFactory.create<WalletModel>(
          WalletModel.name,
          {
            userUUID: user.uuid,
            state: WalletState.ACTIVE,
            default: false,
          },
        );

        await WalletAccountFactory.create<WalletAccountModel>(
          WalletAccountModel.name,
          {
            walletUUID: walletBackup.uuid,
            balance: 0,
            currencyId: walletAccount.currencyId,
            state: WalletAccountState.ACTIVE,
          },
        );

        const message: DeleteWalletByUuidAndUserRequest = {
          uuid: wallet.uuid,
          userId: user.uuid,
          walletBackupId: walletBackup.uuid,
        };

        const result = await controller.execute(
          walletAccountRepository,
          walletRepository,
          userWalletRepository,
          p2pTransferRepository,
          transactionTypeRepository,
          currencyRepository,
          operationRepository,
          limitTypeRepository,
          userLimitRepository,
          globalLimitRepository,
          walletAccountTransactionRepository,
          walletAccountCacheRepository,
          operationEventEmitter,
          userLimitEventEmitter,
          userLimitTrackerRepository,
          logger,
          message,
        );

        expect(result).toBeUndefined();
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(2);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0004 - Should throw WalletNotFoundException when wallet not found', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name, {});

        const message: DeleteWalletByUuidAndUserRequest = {
          uuid: uuidV4(),
          userId: user.uuid,
        };

        const result = controller.execute(
          walletAccountRepository,
          walletRepository,
          userWalletRepository,
          p2pTransferRepository,
          transactionTypeRepository,
          currencyRepository,
          operationRepository,
          limitTypeRepository,
          userLimitRepository,
          globalLimitRepository,
          walletAccountTransactionRepository,
          walletAccountCacheRepository,
          operationEventEmitter,
          userLimitEventEmitter,
          userLimitTrackerRepository,
          logger,
          message,
        );

        await expect(result).rejects.toThrow(WalletNotFoundException);
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0005 - Should throw ForbiddenException when user not allowed', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name, {});

        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
          {
            userUUID: user.uuid,
            state: WalletState.ACTIVE,
            default: false,
          },
        );

        const message: DeleteWalletByUuidAndUserRequest = {
          uuid: wallet.uuid,
          userId: uuidV4(),
        };

        const result = controller.execute(
          walletAccountRepository,
          walletRepository,
          userWalletRepository,
          p2pTransferRepository,
          transactionTypeRepository,
          currencyRepository,
          operationRepository,
          limitTypeRepository,
          userLimitRepository,
          globalLimitRepository,
          walletAccountTransactionRepository,
          walletAccountCacheRepository,
          operationEventEmitter,
          userLimitEventEmitter,
          userLimitTrackerRepository,
          logger,
          message,
        );

        await expect(result).rejects.toThrow(WalletNotFoundException);
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0006 - Should throw WalletCannotBeDeletedException when default wallet', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name, {});

        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
          {
            userUUID: user.uuid,
            state: WalletState.ACTIVE,
            default: true,
          },
        );

        const message: DeleteWalletByUuidAndUserRequest = {
          uuid: wallet.uuid,
          userId: user.uuid,
        };

        const result = controller.execute(
          walletAccountRepository,
          walletRepository,
          userWalletRepository,
          p2pTransferRepository,
          transactionTypeRepository,
          currencyRepository,
          operationRepository,
          limitTypeRepository,
          userLimitRepository,
          globalLimitRepository,
          walletAccountTransactionRepository,
          walletAccountCacheRepository,
          operationEventEmitter,
          userLimitEventEmitter,
          userLimitTrackerRepository,
          logger,
          message,
        );

        await expect(result).rejects.toThrow(WalletCannotBeDeletedException);
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0007 - Should throw WalletAccountHasBalanceException when wallet has balance and wallet backup not provided', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name, {});

        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
          {
            userUUID: user.uuid,
            state: WalletState.ACTIVE,
            default: false,
          },
        );

        await WalletAccountFactory.create<WalletAccountModel>(
          WalletAccountModel.name,
          {
            walletUUID: wallet.uuid,
            balance: 1000,
            state: WalletAccountState.ACTIVE,
          },
        );

        const message: DeleteWalletByUuidAndUserRequest = {
          uuid: wallet.uuid,
          userId: user.uuid,
        };

        const result = controller.execute(
          walletAccountRepository,
          walletRepository,
          userWalletRepository,
          p2pTransferRepository,
          transactionTypeRepository,
          currencyRepository,
          operationRepository,
          limitTypeRepository,
          userLimitRepository,
          globalLimitRepository,
          walletAccountTransactionRepository,
          walletAccountCacheRepository,
          operationEventEmitter,
          userLimitEventEmitter,
          userLimitTrackerRepository,
          logger,
          message,
        );

        await expect(result).rejects.toThrow(WalletAccountHasBalanceException);
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0008 - Should throw WalletNotFoundException when wallet has balance and wallet backup not found', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name, {});

        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
          {
            userUUID: user.uuid,
            state: WalletState.ACTIVE,
            default: false,
          },
        );

        await WalletAccountFactory.create<WalletAccountModel>(
          WalletAccountModel.name,
          {
            walletUUID: wallet.uuid,
            balance: 1000,
            state: WalletAccountState.ACTIVE,
          },
        );

        const message: DeleteWalletByUuidAndUserRequest = {
          uuid: wallet.uuid,
          userId: user.uuid,
          walletBackupId: uuidV4(),
        };

        const result = controller.execute(
          walletAccountRepository,
          walletRepository,
          userWalletRepository,
          p2pTransferRepository,
          transactionTypeRepository,
          currencyRepository,
          operationRepository,
          limitTypeRepository,
          userLimitRepository,
          globalLimitRepository,
          walletAccountTransactionRepository,
          walletAccountCacheRepository,
          operationEventEmitter,
          userLimitEventEmitter,
          userLimitTrackerRepository,
          logger,
          message,
        );

        await expect(result).rejects.toThrow(WalletNotFoundException);
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0009 - Should throw WalletNotFoundException when wallet has balance and wallet backup not is from user', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name, {});

        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
          {
            userUUID: user.uuid,
            state: WalletState.ACTIVE,
            default: false,
          },
        );

        await WalletAccountFactory.create<WalletAccountModel>(
          WalletAccountModel.name,
          {
            walletUUID: wallet.uuid,
            balance: 1000,
            state: WalletAccountState.ACTIVE,
          },
        );

        const walletBackup = await WalletFactory.create<WalletModel>(
          WalletModel.name,
          {
            userUUID: uuidV4(),
            state: WalletState.ACTIVE,
            default: false,
          },
        );

        const message: DeleteWalletByUuidAndUserRequest = {
          uuid: wallet.uuid,
          userId: user.uuid,
          walletBackupId: walletBackup.uuid,
        };

        const result = controller.execute(
          walletAccountRepository,
          walletRepository,
          userWalletRepository,
          p2pTransferRepository,
          transactionTypeRepository,
          currencyRepository,
          operationRepository,
          limitTypeRepository,
          userLimitRepository,
          globalLimitRepository,
          walletAccountTransactionRepository,
          walletAccountCacheRepository,
          operationEventEmitter,
          userLimitEventEmitter,
          userLimitTrackerRepository,
          logger,
          message,
        );

        await expect(result).rejects.toThrow(WalletNotFoundException);
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0010 - Should throw WalletNotFoundException when wallet has balance and wallet backup not is active', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name, {});

        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
          {
            userUUID: user.uuid,
            state: WalletState.ACTIVE,
            default: false,
          },
        );

        await WalletAccountFactory.create<WalletAccountModel>(
          WalletAccountModel.name,
          {
            walletUUID: wallet.uuid,
            balance: 1000,
            state: WalletAccountState.ACTIVE,
          },
        );

        const walletBackup = await WalletFactory.create<WalletModel>(
          WalletModel.name,
          {
            userUUID: user.uuid,
            state: WalletState.DEACTIVATE,
            default: false,
          },
        );

        const message: DeleteWalletByUuidAndUserRequest = {
          uuid: wallet.uuid,
          userId: user.uuid,
          walletBackupId: walletBackup.uuid,
        };

        const result = controller.execute(
          walletAccountRepository,
          walletRepository,
          userWalletRepository,
          p2pTransferRepository,
          transactionTypeRepository,
          currencyRepository,
          operationRepository,
          limitTypeRepository,
          userLimitRepository,
          globalLimitRepository,
          walletAccountTransactionRepository,
          walletAccountCacheRepository,
          operationEventEmitter,
          userLimitEventEmitter,
          userLimitTrackerRepository,
          logger,
          message,
        );

        await expect(result).rejects.toThrow(WalletNotActiveException);
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
