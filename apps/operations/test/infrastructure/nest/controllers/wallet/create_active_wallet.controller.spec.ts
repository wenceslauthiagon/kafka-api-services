import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, ForbiddenException } from '@zro/common';
import { WalletState } from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import { WalletMaxNumberException } from '@zro/operations/application';
import {
  CreateActiveWalletMicroserviceController as Controller,
  CurrencyDatabaseRepository,
  UserWalletDatabaseRepository,
  WalletAccountDatabaseRepository,
  WalletDatabaseRepository,
  WalletModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { CreateActiveWalletRequest } from '@zro/operations/interface';
import { UserFactory } from '@zro/test/users/config';
import { WalletFactory } from '@zro/test/operations/config';

describe('CreateActiveWalletMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  const walletRepository = new WalletDatabaseRepository();
  const walletAccountRepository = new WalletAccountDatabaseRepository();
  const currencyRepository = new CurrencyDatabaseRepository();
  const userWalletRepository = new UserWalletDatabaseRepository();

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateActiveWallet', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create and active wallet successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const message: CreateActiveWalletRequest = {
          uuid: faker.datatype.uuid(),
          userId: user.id,
          userUuid: user.uuid,
          name: faker.datatype.string(10),
        };

        const result = await controller.execute(
          walletAccountRepository,
          currencyRepository,
          walletRepository,
          userWalletRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.uuid).toBeDefined();
        expect(result.value.userId).toBeDefined();
        expect(result.value.name).toBeDefined();
        expect(result.value.state).toBeDefined();
        expect(result.value.default).toBeDefined();
      });

      it('TC0002 - Should return wallet when wallet already exists', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const wallet = await UserFactory.create<WalletModel>(WalletModel.name, {
          userUUID: user.uuid,
        });

        const message: CreateActiveWalletRequest = {
          uuid: wallet.uuid,
          userId: user.id,
          userUuid: user.uuid,
          name: faker.datatype.string(10),
        };

        const result = await controller.execute(
          walletAccountRepository,
          currencyRepository,
          walletRepository,
          userWalletRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.uuid).toBeDefined();
        expect(result.value.userId).toBeDefined();
        expect(result.value.name).toBeDefined();
        expect(result.value.state).toBeDefined();
        expect(result.value.default).toBeDefined();
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should throw ForbiddenException when user not allowed', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
        );

        const message: CreateActiveWalletRequest = {
          uuid: wallet.uuid,
          userId: user.id,
          userUuid: user.uuid,
          name: faker.datatype.string(10),
        };

        const result = controller.execute(
          walletAccountRepository,
          currencyRepository,
          walletRepository,
          userWalletRepository,
          logger,
          message,
          ctx,
        );

        await expect(result).rejects.toThrow(ForbiddenException);
      });

      it('TC0004 - Should throw WalletMaxNumberException when quantity of wallets is greater or equal than defined', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        await WalletFactory.createMany<WalletModel>(WalletModel.name, 10, {
          userUUID: user.uuid,
          state: WalletState.ACTIVE,
        });

        const message: CreateActiveWalletRequest = {
          uuid: faker.datatype.uuid(),
          userId: user.id,
          userUuid: user.uuid,
          name: faker.datatype.string(10),
        };

        const result = controller.execute(
          walletAccountRepository,
          currencyRepository,
          walletRepository,
          userWalletRepository,
          logger,
          message,
          ctx,
        );

        await expect(result).rejects.toThrow(WalletMaxNumberException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
