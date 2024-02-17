import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
  MissingDataException,
} from '@zro/common';
import { UserWalletRepository, WalletRepository } from '@zro/operations/domain';
import { UserService } from '@zro/operations/application';
import {
  UpdateUserWalletByWalletMicroserviceController as Controller,
  UserWalletDatabaseRepository,
  UserWalletModel,
  WalletDatabaseRepository,
  WalletModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { UpdateUserWalletByWalletRequest } from '@zro/operations/interface';
import { UserWalletFactory, WalletFactory } from '@zro/test/operations/config';

describe('UpdateUserWalletByWalletMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let walletRepository: WalletRepository;
  let userWalletRepository: UserWalletRepository;

  const CLIENT = 'CLIENT';

  const userService: UserService = createMock<UserService>();
  const mockGetUserByUuidService = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeEach(() => jest.resetAllMocks());

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    walletRepository = new WalletDatabaseRepository();
    userWalletRepository = new UserWalletDatabaseRepository();
  });

  describe('UpdateUserWalletByWallet', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should update user wallet successfully', async () => {
        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
        );
        const userWallet = await UserWalletFactory.create<UserWalletModel>(
          UserWalletModel.name,
          { walletId: wallet.uuid },
        );

        const message: UpdateUserWalletByWalletRequest = {
          ownerWalletId: wallet.userUUID,
          userId: userWallet.userId,
          walletId: userWallet.walletId,
          permissionTypeTags: [CLIENT],
        };

        const userName = faker.name.firstName();

        mockGetUserByUuidService.mockResolvedValue({
          uuid: userWallet.userId,
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
        expect(result.value.id).toBe(userWallet.userId);
        expect(result.value.name).toBe(userName);
        expect(result.value.permissionTypeTags).toStrictEqual([CLIENT]);
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledWith({
          userId: userWallet.userId,
        });
      });
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not update user wallet if params is null', async () => {
      const message: UpdateUserWalletByWalletRequest = {
        ownerWalletId: null,
        userId: null,
        walletId: null,
        permissionTypeTags: null,
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
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not update user wallet if permission is root', async () => {
      const wallet = await WalletFactory.create<WalletModel>(WalletModel.name);
      const userWallet = await UserWalletFactory.create<UserWalletModel>(
        UserWalletModel.name,
        { walletId: wallet.uuid },
      );

      const message: UpdateUserWalletByWalletRequest = {
        ownerWalletId: wallet.userUUID,
        userId: userWallet.userId,
        walletId: userWallet.walletId,
        permissionTypeTags: ['ROOT'],
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

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not update user wallet if no permission', async () => {
      const wallet = await WalletFactory.create<WalletModel>(WalletModel.name);
      const userWallet = await UserWalletFactory.create<UserWalletModel>(
        UserWalletModel.name,
        { walletId: wallet.uuid },
      );

      const message: UpdateUserWalletByWalletRequest = {
        ownerWalletId: wallet.userUUID,
        userId: userWallet.userId,
        walletId: userWallet.walletId,
        permissionTypeTags: [],
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
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
