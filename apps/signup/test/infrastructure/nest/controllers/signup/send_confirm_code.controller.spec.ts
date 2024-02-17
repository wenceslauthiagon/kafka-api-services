import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { SignupRepository } from '@zro/signup/domain';
import {
  SendConfirmCodeSignupMicroserviceController,
  SignupDatabaseRepository,
  SignupModel,
  NotificationServiceKafka,
} from '@zro/signup/infrastructure';
import { AppModule } from '@zro/signup/infrastructure/nest/modules/app.module';
import { SignupFactory } from '@zro/test/signup/config';
import { SendConfirmCodeSignupRequest } from '@zro/signup/interface';

describe('SendConfirmCodeSignupMicroserviceController', () => {
  let module: TestingModule;
  let controller: SendConfirmCodeSignupMicroserviceController;
  let signupRepository: SignupRepository;

  const notificationService: NotificationServiceKafka =
    createMock<NotificationServiceKafka>();
  const mockSendEmail: jest.Mock = On(notificationService).get(
    method((mock) => mock.sendEmailCode),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<SendConfirmCodeSignupMicroserviceController>(
      SendConfirmCodeSignupMicroserviceController,
    );
    signupRepository = new SignupDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should update user pin has created successfully', async () => {
      const signup = await SignupFactory.create<SignupModel>(SignupModel.name);

      const message: SendConfirmCodeSignupRequest = {
        id: signup.id,
      };

      await controller.execute(
        signupRepository,
        notificationService,
        logger,
        message,
      );

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw InvalidDataFormatException when missing params', async () => {
      const message: SendConfirmCodeSignupRequest = {
        id: null,
      };

      const testScript = () =>
        controller.execute(
          signupRepository,
          notificationService,
          logger,
          message,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockSendEmail).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
