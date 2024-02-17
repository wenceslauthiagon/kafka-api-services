import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { UserWalletRepository, WalletRepository } from '@zro/operations/domain';
import { UserService } from '@zro/operations/application';
import {
  GetUserWalletByUserAndWalletMicroserviceController as Controller,
  UserWalletDatabaseRepository,
  UserWalletModel,
  WalletDatabaseRepository,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { GetUserWalletByUserAndWalletRequest } from '@zro/operations/interface';
import { UserWalletFactory } from '@zro/test/operations/config';

describe('GetUserWalletByUserAndWalletMicroserviceController', () => {
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

  describe('GetUserWalletByUserAndWallet', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get user wallet successfully', async () => {
        const userCreated = await UserWalletFactory.create<UserWalletModel>(
          UserWalletModel.name,
        );

        const message: GetUserWalletByUserAndWalletRequest = {
          userId: userCreated.userId,
          walletId: userCreated.walletId,
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
        expect(result.value.userId).toBe(userCreated.userId);
        expect(result.value.wallet.uuid).toBe(userCreated.walletId);
        expect(result.value.wallet.userId).toBe(userUuid);
        expect(result.value.wallet.userName).toBe(userName);
      });
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not return user wallet if id is null', async () => {
      const message: GetUserWalletByUserAndWalletRequest = {
        userId: null,
        walletId: null,
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

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
