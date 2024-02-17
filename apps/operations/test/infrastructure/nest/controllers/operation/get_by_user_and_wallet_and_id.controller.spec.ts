import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  WalletAccountModel,
  GetOperationByUserAndWalletAndIdMicroserviceController as Controller,
  OperationDatabaseRepository,
  OperationModel,
  WalletModel,
  WalletAccountCacheDatabaseRepository,
  UserWalletDatabaseRepository,
  UserWalletModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { GetOperationByUserAndWalletAndIdRequest } from '@zro/operations/interface';
import {
  OperationFactory,
  UserWalletFactory,
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';

describe('GetOperationByUserAndWalletAndIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  const operationRepository = new OperationDatabaseRepository();
  const walletAccountCacheRepository =
    new WalletAccountCacheDatabaseRepository();
  const userWalletRepository = new UserWalletDatabaseRepository();

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetOperationByUserAndWalletAndId', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should be able to get operations successfully', async () => {
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
          2,
          { ownerWalletAccountId: walletAccount.id },
        );

        const operation = await OperationFactory.create<OperationModel>(
          OperationModel.name,
          {
            ownerWalletAccountId: 0,
            beneficiaryWalletAccountId: walletAccount.id,
          },
        );

        const message: GetOperationByUserAndWalletAndIdRequest = {
          userId: user.uuid,
          walletId: wallet.uuid,
          id: operation.id,
        };

        const result = await controller.execute(
          operationRepository,
          walletAccountCacheRepository,
          userWalletRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.fee).toBeDefined();
        expect(result.value.state).toBeDefined();
        expect(result.value.description).toBeDefined();
        expect(result.value.value).toBeDefined();
        expect(result.value.createdAt).toBeDefined();
        expect(result.value.currencySymbol).toBeDefined();
        expect(result.value.transactionTag).toBeDefined();
        expect(result.value.ownerWalletUuid).toBeNull();
        expect(result.value.beneficiaryWalletUuid).toBe(wallet.uuid);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
