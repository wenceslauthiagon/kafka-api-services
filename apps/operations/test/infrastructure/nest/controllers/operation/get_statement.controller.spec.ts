import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  WalletAccountModel,
  GetStatementMicroserviceController as Controller,
  OperationDatabaseRepository,
  OperationModel,
  WalletModel,
  WalletAccountCacheDatabaseRepository,
  UserWalletDatabaseRepository,
  UserWalletModel,
  WalletAccountTransactionModel,
  WalletAccountTransactionDatabaseRepository,
} from '@zro/operations/infrastructure';
import { GetStatementRequest } from '@zro/operations/interface';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import {
  OperationFactory,
  UserWalletFactory,
  WalletAccountFactory,
  WalletAccountTransactionFactory,
  WalletFactory,
} from '@zro/test/operations/config';

describe('GetStatementMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  const operationRepository = new OperationDatabaseRepository();
  const walletAccountCacheRepository =
    new WalletAccountCacheDatabaseRepository();
  const userWalletRepository = new UserWalletDatabaseRepository();
  const walletAccountTransactionRepository =
    new WalletAccountTransactionDatabaseRepository();

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetStatement', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should be able to get operations by filter successfully', async () => {
        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
        );
        const user = new UserEntity({ uuid: wallet.userUUID });
        const walletAccount =
          await WalletAccountFactory.create<WalletAccountModel>(
            WalletAccountModel.name,
            { walletUUID: wallet.uuid, walletId: wallet.id },
          );

        await UserWalletFactory.create<UserWalletModel>(UserWalletModel.name, {
          userId: user.uuid,
          walletId: wallet.uuid,
        });

        await OperationFactory.createMany<OperationModel>(
          OperationModel.name,
          3,
          { ownerWalletAccountId: walletAccount.id },
        );

        const operations = await OperationFactory.createMany<OperationModel>(
          OperationModel.name,
          3,
          { beneficiaryWalletAccountId: walletAccount.id },
        );

        for (const operation of operations) {
          await WalletAccountTransactionFactory.create<WalletAccountTransactionModel>(
            WalletAccountTransactionModel.name,
            { operationId: operation.id },
          );
        }

        const message: GetStatementRequest = {
          userId: user.uuid,
          walletId: wallet.uuid,
        };

        const result = await controller.execute(
          operationRepository,
          walletAccountCacheRepository,
          walletAccountTransactionRepository,
          userWalletRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.page).toBe(1);
        expect(result.value.total).toBe(6);
        expect(result.value.pageTotal).toBe(1);
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.fee).toBeDefined();
          expect(res.state).toBeDefined();
          expect(res.description).toBeDefined();
          expect(res.value).toBeDefined();
          expect(res.createdAt).toBeDefined();
          expect(res.revertedAt).toBeDefined();
          expect(res.currencyId).toBeDefined();
          expect(res.currencySymbol).toBeDefined();
          expect(res.transactionTag).toBeDefined();
          expect(res.transactionTypeId).toBeDefined();
        });
      });

      it('TC0002 - Should be able get an empty array with no operations was found', async () => {
        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
        );
        const user = new UserEntity({ uuid: wallet.userUUID });

        await UserWalletFactory.create<UserWalletModel>(UserWalletModel.name, {
          userId: user.uuid,
          walletId: wallet.uuid,
        });

        const message: GetStatementRequest = {
          userId: user.uuid,
          walletId: wallet.uuid,
        };

        const result = await controller.execute(
          operationRepository,
          walletAccountCacheRepository,
          walletAccountTransactionRepository,
          userWalletRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.data).toBeDefined();
        expect(result.value.data.length).toBe(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
