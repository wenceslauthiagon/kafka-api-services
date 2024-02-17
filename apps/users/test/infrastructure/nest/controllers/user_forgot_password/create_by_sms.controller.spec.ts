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
  UserRepository,
} from '@zro/users/domain';
import { NotificationService } from '@zro/users/application';
import {
  CreateUserForgotPasswordBySmsRequest,
  UserForgotPasswordEventEmitterControllerInterface,
  UserForgotPasswordEventType,
} from '@zro/users/interface';
import {
  CreateUserForgotPasswordBySmsMicroserviceController as Controller,
  UserForgotPasswordDatabaseRepository,
  UserDatabaseRepository,
  UserModel,
  UserForgotPasswordModel,
} from '@zro/users/infrastructure';
import { UserFactory, UserForgotPasswordFactory } from '@zro/test/users/config';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { KafkaContext } from '@nestjs/microservices';

describe('CreateUserForgotPasswordBySmsMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let userRepository: UserRepository;
  let userForgotPasswordRepository: UserForgotPasswordRepository;

  const eventEmitterController: UserForgotPasswordEventEmitterControllerInterface =
    createMock<UserForgotPasswordEventEmitterControllerInterface>();
  const mockCreatedUserForgotPasswordEventController: jest.Mock = On(
    eventEmitterController,
  ).get(method((mock) => mock.emitUserForgotPasswordEvent));

  const notificationService: NotificationService =
    createMock<NotificationService>();
  const mockSendSmsService: jest.Mock = On(notificationService).get(
    method((mock) => mock.sendSms),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    userRepository = new UserDatabaseRepository();
    userForgotPasswordRepository = new UserForgotPasswordDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateUserForgotPasswordBySms', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create if missing params', async () => {
        const message: CreateUserForgotPasswordBySmsRequest = {
          phoneNumber: null,
          id: uuidV4(),
        };

        const test = () =>
          controller.execute(
            userRepository,
            userForgotPasswordRepository,
            eventEmitterController,
            notificationService,
            logger,
            message,
            ctx,
          );

        await expect(test).rejects.toThrow(InvalidDataFormatException);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should create successfully if user already forgot password', async () => {
        const user = await UserFactory.create<UserModel>(UserModel.name);

        const oldUserForgotPassword =
          await UserForgotPasswordFactory.create<UserForgotPasswordModel>(
            UserForgotPasswordModel.name,
            {
              state: UserForgotPasswordState.PENDING,
              userId: user.uuid,
            },
          );

        const id = uuidV4();

        const message: CreateUserForgotPasswordBySmsRequest = {
          id,
          phoneNumber: user.phoneNumber,
        };

        const result = await controller.execute(
          userRepository,
          userForgotPasswordRepository,
          eventEmitterController,
          notificationService,
          logger,
          message,
          ctx,
        );

        const oldUserForgotPasswordAfter =
          await userForgotPasswordRepository.getById(oldUserForgotPassword.id);

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(id);
        expect(oldUserForgotPasswordAfter.state).toBe(
          UserForgotPasswordState.DECLINED,
        );
        expect(mockSendSmsService).toHaveBeenCalledTimes(1);
        expect(
          mockCreatedUserForgotPasswordEventController,
        ).toHaveBeenCalledTimes(1);
        expect(
          mockCreatedUserForgotPasswordEventController.mock.calls[0][0],
        ).toBe(UserForgotPasswordEventType.CREATED);
      });

      it('TC0003 - Should create successfully if user not forgot password', async () => {
        const user = await UserFactory.create<UserModel>(UserModel.name);

        const id = uuidV4();

        const message: CreateUserForgotPasswordBySmsRequest = {
          id,
          phoneNumber: user.phoneNumber,
        };

        const result = await controller.execute(
          userRepository,
          userForgotPasswordRepository,
          eventEmitterController,
          notificationService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(id);
        expect(mockSendSmsService).toHaveBeenCalledTimes(1);
        expect(
          mockCreatedUserForgotPasswordEventController,
        ).toHaveBeenCalledTimes(1);
        expect(
          mockCreatedUserForgotPasswordEventController.mock.calls[0][0],
        ).toBe(UserForgotPasswordEventType.CREATED);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
