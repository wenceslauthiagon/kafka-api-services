import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { UserRepository } from '@zro/users/domain';
import {
  UpdateUserPinHasCreatedMicroserviceController,
  UserDatabaseRepository,
  UserModel,
} from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import {
  UpdateUserPinHasCreatedRequest,
  UserEventEmitterControllerInterface,
  UserEventType,
} from '@zro/users/interface';
import { UserFactory } from '@zro/test/users/config';

describe('UpdateUserPinHasCreatedMicroserviceController', () => {
  let module: TestingModule;
  let controller: UpdateUserPinHasCreatedMicroserviceController;
  let userRepository: UserRepository;

  const eventEmitter: UserEventEmitterControllerInterface =
    createMock<UserEventEmitterControllerInterface>();
  const mockUpdatePinUserEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitUserEvent),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<UpdateUserPinHasCreatedMicroserviceController>(
      UpdateUserPinHasCreatedMicroserviceController,
    );
    userRepository = new UserDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should update user pin has created successfully', async () => {
      const user = await UserFactory.create<UserModel>(UserModel.name, {
        pinHasCreated: true,
      });

      const message: UpdateUserPinHasCreatedRequest = {
        uuid: user.uuid,
      };

      await controller.execute(userRepository, eventEmitter, logger, message);

      expect(mockUpdatePinUserEvent).toHaveBeenCalledTimes(1);
      expect(mockUpdatePinUserEvent.mock.calls[0][0]).toBe(
        UserEventType.UPDATE_PIN,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw InvalidDataFormatException when missing params', async () => {
      const message: UpdateUserPinHasCreatedRequest = {
        uuid: null,
      };

      const testScript = () =>
        controller.execute(userRepository, eventEmitter, logger, message);

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockUpdatePinUserEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
