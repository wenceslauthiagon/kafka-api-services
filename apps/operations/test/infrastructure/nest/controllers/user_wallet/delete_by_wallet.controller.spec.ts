import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { UserWalletRepository } from '@zro/operations/domain';
import { WalletCannotBeDeletedException } from '@zro/operations/application';
import {
  DeleteUserWalletMicroserviceController as Controller,
  UserWalletDatabaseRepository,
  UserWalletModel,
  WalletDatabaseRepository,
  WalletModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { DeleteUserWalletRequest } from '@zro/operations/interface';
import { UserWalletFactory, WalletFactory } from '@zro/test/operations/config';

describe('DeleteUserWalletMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let userWalletRepository: UserWalletRepository;
  let walletRepository: WalletDatabaseRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    userWalletRepository = new UserWalletDatabaseRepository();
    walletRepository = new WalletDatabaseRepository();
  });

  describe('DeleteUserWalletMicroserviceController', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get delete user wallet successfully', async () => {
        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
        );
        const userWallet = await UserWalletFactory.create<UserWalletModel>(
          UserWalletModel.name,
          { walletId: wallet.uuid },
        );

        const message: DeleteUserWalletRequest = {
          ownerWalletId: wallet.userUUID,
          userId: userWallet.userId,
          walletId: wallet.uuid,
        };

        await controller.execute(
          userWalletRepository,
          walletRepository,
          logger,
          message,
        );

        const userWalletEntity = userWallet.toDomain();
        const userWalletAfterDelete =
          await userWalletRepository.getByUserAndWallet(
            userWalletEntity.user,
            userWalletEntity.wallet,
          );

        expect(userWalletAfterDelete).toBeNull();
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not delete user wallet if invalid data', async () => {
        const message: DeleteUserWalletRequest = {
          ownerWalletId: null,
          userId: null,
          walletId: null,
        };

        await expect(() =>
          controller.execute(
            userWalletRepository,
            walletRepository,
            logger,
            message,
          ),
        ).rejects.toThrow(InvalidDataFormatException);
      });

      it('TC0003 - Should not delete user wallet if owner received is not wallet owner', async () => {
        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
        );

        const userWallet = await UserWalletFactory.create<UserWalletModel>(
          UserWalletModel.name,
          { walletId: wallet.uuid },
        );

        const message: DeleteUserWalletRequest = {
          ownerWalletId: uuidV4(),
          userId: userWallet.userId,
          walletId: wallet.uuid,
        };

        await controller.execute(
          userWalletRepository,
          walletRepository,
          logger,
          message,
        );

        const userWalletEntity = userWallet.toDomain();
        const userWalletAfterDelete =
          await userWalletRepository.getByUserAndWallet(
            userWalletEntity.user,
            userWalletEntity.wallet,
          );

        expect(userWalletAfterDelete).toBeDefined();
      });

      it('TC0004 - Should not delete user wallet if user received is owner', async () => {
        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
        );

        const userWallet = await UserWalletFactory.create<UserWalletModel>(
          UserWalletModel.name,
          { walletId: wallet.uuid, userId: wallet.userUUID },
        );

        const message: DeleteUserWalletRequest = {
          ownerWalletId: wallet.userUUID,
          userId: wallet.userUUID,
          walletId: wallet.uuid,
        };

        await expect(() =>
          controller.execute(
            userWalletRepository,
            walletRepository,
            logger,
            message,
          ),
        ).rejects.toThrow(WalletCannotBeDeletedException);

        const userWalletEntity = userWallet.toDomain();
        const userWalletAfterDelete =
          await userWalletRepository.getByUserAndWallet(
            userWalletEntity.user,
            userWalletEntity.wallet,
          );

        expect(userWalletAfterDelete).toBeDefined();
      });

      it('TC0005 - Should not delete user wallet if not found', async () => {
        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
        );

        const message: DeleteUserWalletRequest = {
          ownerWalletId: wallet.userUUID,
          userId: uuidV4(),
          walletId: wallet.uuid,
        };

        await controller.execute(
          userWalletRepository,
          walletRepository,
          logger,
          message,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
