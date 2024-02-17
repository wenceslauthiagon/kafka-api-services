import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { UserWalletRepository } from '@zro/operations/domain';
import { WalletCannotBeDeletedException } from '@zro/operations/application';
import {
  DeleteUserWalletByUserAndWalletMicroserviceController as Controller,
  UserWalletDatabaseRepository,
  UserWalletModel,
  WalletDatabaseRepository,
  WalletModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { DeleteUserWalletByUserAndWalletRequest } from '@zro/operations/interface';
import { UserWalletFactory, WalletFactory } from '@zro/test/operations/config';

describe('DeleteUserWalletByUserAndWalletMicroserviceController', () => {
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

  describe('DeleteUserWalletByUserAndWalletMicroserviceController', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get delete user wallet successfully', async () => {
        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
        );
        const userWallet = await UserWalletFactory.create<UserWalletModel>(
          UserWalletModel.name,
          { walletId: wallet.uuid },
        );

        const message: DeleteUserWalletByUserAndWalletRequest = {
          userId: userWallet.userId,
          walletId: userWallet.walletId,
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
        const message: DeleteUserWalletByUserAndWalletRequest = {
          userId: null,
          walletId: uuidV4(),
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

      it('TC0003 - Should not delete user wallet if user is owner wallet', async () => {
        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
        );

        const userWallet = await UserWalletFactory.create<UserWalletModel>(
          UserWalletModel.name,
          { walletId: wallet.uuid, userId: wallet.userUUID },
        );

        const message: DeleteUserWalletByUserAndWalletRequest = {
          userId: userWallet.userId,
          walletId: userWallet.walletId,
        };

        await expect(() =>
          controller.execute(
            userWalletRepository,
            walletRepository,
            logger,
            message,
          ),
        ).rejects.toThrow(WalletCannotBeDeletedException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
