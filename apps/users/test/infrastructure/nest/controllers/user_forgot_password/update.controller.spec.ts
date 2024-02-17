import { createMock } from 'ts-auto-mock';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  UserForgotPasswordRepository,
  UserForgotPasswordState,
  UserRepository,
} from '@zro/users/domain';
import {
  UpdateUserForgotPasswordRequest,
  UserForgotPasswordEventEmitterControllerInterface,
  UserForgotPasswordEventType,
} from '@zro/users/interface';
import {
  UpdateUserForgotPasswordMicroserviceController as Controller,
  UserForgotPasswordDatabaseRepository,
  UserDatabaseRepository,
  UserForgotPasswordModel,
} from '@zro/users/infrastructure';
import { UserForgotPasswordFactory } from '@zro/test/users/config';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { KafkaContext } from '@nestjs/microservices';

describe('UpdateUserForgotPasswordMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let userRepository: UserRepository;
  let userForgotPasswordRepository: UserForgotPasswordRepository;

  const eventEmitterController: UserForgotPasswordEventEmitterControllerInterface =
    createMock<UserForgotPasswordEventEmitterControllerInterface>();
  const mockUpdatedUserForgotPasswordEventController: jest.Mock = On(
    eventEmitterController,
  ).get(method((mock) => mock.emitUserForgotPasswordEvent));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    userRepository = new UserDatabaseRepository();
    userForgotPasswordRepository = new UserForgotPasswordDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('UpdateUserForgotPassword', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create if missing params', async () => {
        const message: UpdateUserForgotPasswordRequest = {
          id: faker.datatype.uuid(),
          code: null,
          newPassword: null,
        };

        const test = () =>
          controller.execute(
            userRepository,
            userForgotPasswordRepository,
            eventEmitterController,
            logger,
            message,
            ctx,
          );

        await expect(test).rejects.toThrow(InvalidDataFormatException);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should update successfully', async () => {
        const userForgotPassword =
          await UserForgotPasswordFactory.create<UserForgotPasswordModel>(
            UserForgotPasswordModel.name,
            {
              state: UserForgotPasswordState.PENDING,
              createdAt: faker.date.future(),
            },
          );

        const { id, code } = userForgotPassword;
        const newPassword = '007NoTimeToDi%';

        const message: UpdateUserForgotPasswordRequest = {
          id,
          code,
          newPassword,
        };

        const result = await controller.execute(
          userRepository,
          userForgotPasswordRepository,
          eventEmitterController,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.state).toBe(UserForgotPasswordState.CONFIRMED);
        expect(result.value.userId).toBe(userForgotPassword.userId);
        expect(result.value.userPhoneNumber).toBe(
          userForgotPassword.phoneNumber,
        );
        expect(
          mockUpdatedUserForgotPasswordEventController,
        ).toHaveBeenCalledTimes(1);
        expect(
          mockUpdatedUserForgotPasswordEventController.mock.calls[0][0],
        ).toBe(UserForgotPasswordEventType.CONFIRMED);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
