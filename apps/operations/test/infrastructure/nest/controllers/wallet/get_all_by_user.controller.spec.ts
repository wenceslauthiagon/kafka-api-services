import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  GetAllWalletByUserMicroserviceController as Controller,
  WalletDatabaseRepository,
  WalletModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { WalletFactory } from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';
import { GetAllWalletByUserRequest } from '@zro/operations/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('GetAllWalletByUserMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  const walletRepository = new WalletDatabaseRepository();

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetAllWalletByUsers', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should be able to wallets by filter successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        await WalletFactory.createMany<WalletModel>(WalletModel.name, 5, {
          user,
        });

        const message: GetAllWalletByUserRequest = {
          userId: user.uuid,
        };

        const result = await controller.execute(
          walletRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value).toBeDefined();
        result.value.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.uuid).toBeDefined();
          expect(res.name).toBeDefined();
          expect(res.default).toBeDefined();
          expect(res.state).toBeDefined();
        });
      });

      it('TC0002 - Should be able get an empty array with no wallets was found', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        await WalletFactory.createMany<WalletModel>(WalletModel.name, 5, {
          user,
        });

        const message: GetAllWalletByUserRequest = {
          userId: uuidV4(),
        };

        const result = await controller.execute(
          walletRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.length).toBe(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
