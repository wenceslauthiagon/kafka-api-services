import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { UserWalletRepository, WalletRepository } from '@zro/operations/domain';
import { UserService } from '@zro/operations/application';
import {
  GetAllUserWalletByUserMicroserviceController as Controller,
  UserWalletDatabaseRepository,
  UserWalletModel,
  WalletDatabaseRepository,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { GetAllUserWalletByUserRequest } from '@zro/operations/interface';
import { UserWalletFactory } from '@zro/test/operations/config';

describe('GetAllUserWalletByUserMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let walletRepository: WalletRepository;
  let userWalletRepository: UserWalletRepository;

  const userService: UserService = createMock<UserService>();
  const mockGetUserByUuidService = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    walletRepository = new WalletDatabaseRepository();
    userWalletRepository = new UserWalletDatabaseRepository();
  });

  describe('UserWalletByUserId', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get user wallet successfully', async () => {
        const userCreated = await UserWalletFactory.create<UserWalletModel>(
          UserWalletModel.name,
        );

        const message: GetAllUserWalletByUserRequest = {
          userId: userCreated.userId,
        };

        const userUuid = faker.datatype.uuid();
        const userName = faker.name.firstName();

        mockGetUserByUuidService.mockResolvedValue({
          uuid: userUuid,
          name: userName,
        });

        const result = await controller.execute(
          walletRepository,
          userWalletRepository,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        result.value.map((item) => {
          expect(item.userId).toBe(userCreated.userId);
          expect(item.wallet.uuid).toBe(userCreated.walletId);
          expect(item.wallet.userId).toBe(userUuid);
          expect(item.wallet.userName).toBe(userName);
        });
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not return user if id is null', async () => {
        const message: GetAllUserWalletByUserRequest = {
          userId: null,
        };

        const testScript = () =>
          controller.execute(
            walletRepository,
            userWalletRepository,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
