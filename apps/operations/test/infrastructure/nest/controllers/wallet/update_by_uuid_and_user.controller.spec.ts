import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger } from '@zro/common';
import { WalletState } from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import {
  WalletNotActiveException,
  WalletNotFoundException,
} from '@zro/operations/application';
import {
  UpdateWalletByUuidAndUserMicroserviceController as Controller,
  WalletDatabaseRepository,
  WalletModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { UpdateWalletByUuidAndUserRequest } from '@zro/operations/interface';
import { UserFactory } from '@zro/test/users/config';
import { WalletFactory } from '@zro/test/operations/config';

describe('UpdateWalletByUuidAndUserMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  const walletRepository = new WalletDatabaseRepository();

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('UpdateWalletByUuidAndUser', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should update wallet by uuid and user successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name, {});

        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,

          {
            userUUID: user.uuid,
            state: WalletState.ACTIVE,
            default: false,
          },
        );

        const message: UpdateWalletByUuidAndUserRequest = {
          uuid: wallet.uuid,
          userId: wallet.userUUID,
          name: faker.datatype.string(10),
        };

        const result = await controller.execute(
          walletRepository,
          logger,
          message,
          ctx,
        );

        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.uuid).toBeDefined();
        expect(result.value.userId).toBeDefined();
        expect(result.value.name).toBeDefined();
        expect(result.value.state).toBeDefined();
        expect(result.value.default).toBeDefined();
        expect(result.value.createdAt).toBeDefined();
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should throw WalletNotFoundException when wallet not found', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name, {});

        const message: UpdateWalletByUuidAndUserRequest = {
          uuid: faker.datatype.uuid(),
          userId: user.uuid,
          name: faker.datatype.string(10),
        };

        const result = controller.execute(
          walletRepository,
          logger,
          message,
          ctx,
        );

        await expect(result).rejects.toThrow(WalletNotFoundException);
      });

      it('TC0003 - Should throw ForbiddenException when user not allowed', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name, {});

        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
          {
            userUUID: user.uuid,
            state: WalletState.ACTIVE,
            default: false,
          },
        );

        const message: UpdateWalletByUuidAndUserRequest = {
          uuid: wallet.uuid,
          userId: faker.datatype.uuid(),
          name: faker.datatype.string(10),
        };

        const result = controller.execute(
          walletRepository,
          logger,
          message,
          ctx,
        );

        await expect(result).rejects.toThrow(WalletNotFoundException);
      });

      it('TC0004 - Should throw WalletNotFoundException when wallet state is deactivate', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name, {});

        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
          {
            userUUID: user.uuid,
            state: WalletState.DEACTIVATE,
            default: false,
          },
        );

        const message: UpdateWalletByUuidAndUserRequest = {
          uuid: wallet.uuid,
          userId: user.uuid,
          name: faker.datatype.string(10),
        };

        const result = controller.execute(
          walletRepository,
          logger,
          message,
          ctx,
        );

        await expect(result).rejects.toThrow(WalletNotActiveException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
