import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { DeleteUserWithdrawSettingMicroserviceController as Controller } from '@zro/utils/infrastructure';
import { AppModule } from '@zro/utils/infrastructure/nest/modules/app.module';
import {
  UserWithdrawSettingDatabaseRepository,
  UserWithdrawSettingModel,
} from '@zro/utils/infrastructure';
import { UserWithdrawSettingFactory } from '@zro/test/utils/config';
import { DeleteUserWithdrawSettingRequest } from '@zro/utils/interface';
import { WithdrawSettingState } from '@zro/utils/domain';
import {
  UserWithdrawSettingInvalidStateException,
  UserWithdrawSettingNotFoundException,
} from '@zro/utils/application';

describe('DeleteUserWithdrawSettingMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let userWithdrawSettingRepository: UserWithdrawSettingDatabaseRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    userWithdrawSettingRepository = new UserWithdrawSettingDatabaseRepository();
  });

  describe('DeleteUserWithdrawSettingMicroserviceController', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should delete user withdraw setting successfully', async () => {
        const withdraw =
          await UserWithdrawSettingFactory.create<UserWithdrawSettingModel>(
            UserWithdrawSettingModel.name,
            { state: WithdrawSettingState.ACTIVE },
          );

        const message: DeleteUserWithdrawSettingRequest = {
          id: withdraw.id,
        };

        await controller.execute(
          userWithdrawSettingRepository,
          logger,
          message,
        );

        const withdrawAfterDelete = await userWithdrawSettingRepository.getById(
          withdraw.id,
        );

        expect(withdrawAfterDelete).toBe(null);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not delete user withdraw setting if invalid data', async () => {
        const message: DeleteUserWithdrawSettingRequest = {
          id: null,
        };

        await expect(() =>
          controller.execute(userWithdrawSettingRepository, logger, message),
        ).rejects.toThrow(InvalidDataFormatException);
      });

      it('TC0003 - Should not delete withdraw if it is already deactive', async () => {
        const withdraw =
          await UserWithdrawSettingFactory.create<UserWithdrawSettingModel>(
            UserWithdrawSettingModel.name,
            { state: WithdrawSettingState.DEACTIVE },
          );

        const message: DeleteUserWithdrawSettingRequest = {
          id: withdraw.id,
        };

        await expect(
          controller.execute(userWithdrawSettingRepository, logger, message),
        ).rejects.toThrow(UserWithdrawSettingInvalidStateException);
      });

      it('TC0004 - Should not delete withdraw if not found', async () => {
        const message: DeleteUserWithdrawSettingRequest = {
          id: uuidV4(),
        };

        await expect(
          controller.execute(userWithdrawSettingRepository, logger, message),
        ).rejects.toThrow(UserWithdrawSettingNotFoundException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
