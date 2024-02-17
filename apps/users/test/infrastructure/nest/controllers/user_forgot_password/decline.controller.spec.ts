import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  UserForgotPasswordRepository,
  UserForgotPasswordState,
} from '@zro/users/domain';
import {
  DeclineUserForgotPasswordRequest,
  UserForgotPasswordEventEmitterControllerInterface,
  UserForgotPasswordEventType,
} from '@zro/users/interface';
import {
  DeclineUserForgotPasswordMicroserviceController as Controller,
  UserForgotPasswordDatabaseRepository,
  UserForgotPasswordModel,
} from '@zro/users/infrastructure';
import { UserForgotPasswordFactory } from '@zro/test/users/config';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';

describe('DeclineUserForgotPasswordMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let userForgotPasswordRepository: UserForgotPasswordRepository;

  const eventEmitterController: UserForgotPasswordEventEmitterControllerInterface =
    createMock<UserForgotPasswordEventEmitterControllerInterface>();
  const mockDeclinedUserForgotPasswordEventController: jest.Mock = On(
    eventEmitterController,
  ).get(method((mock) => mock.emitUserForgotPasswordEvent));

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    userForgotPasswordRepository = new UserForgotPasswordDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('DeclineUserForgotPassword', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create if missing params', async () => {
        const message: DeclineUserForgotPasswordRequest = {
          id: uuidV4(),
          userId: null,
        };

        const test = () =>
          controller.execute(
            userForgotPasswordRepository,
            eventEmitterController,
            logger,
            message,
          );

        await expect(test).rejects.toThrow(InvalidDataFormatException);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should decline successfully', async () => {
        const userForgotPassword =
          await UserForgotPasswordFactory.create<UserForgotPasswordModel>(
            UserForgotPasswordModel.name,
            {
              state: UserForgotPasswordState.PENDING,
            },
          );

        const message: DeclineUserForgotPasswordRequest = {
          id: userForgotPassword.id,
          userId: userForgotPassword.userId,
        };

        await controller.execute(
          userForgotPasswordRepository,
          eventEmitterController,
          logger,
          message,
        );

        const userForgotPasswordDeclined =
          await userForgotPasswordRepository.getById(userForgotPassword.id);

        expect(userForgotPasswordDeclined).toBeDefined();
        expect(userForgotPasswordDeclined.state).toBe(
          UserForgotPasswordState.DECLINED,
        );
        expect(
          mockDeclinedUserForgotPasswordEventController,
        ).toHaveBeenCalledTimes(1);
        expect(
          mockDeclinedUserForgotPasswordEventController.mock.calls[0][0],
        ).toBe(UserForgotPasswordEventType.DECLINED);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
