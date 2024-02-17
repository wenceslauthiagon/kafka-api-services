import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import {
  UserForgotPasswordRepository,
  UserRepository,
} from '@zro/users/domain';
import {
  UpdateUserPinUseCase,
  UserEventEmitter,
  UserNotFoundException,
} from '@zro/users/application';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import {
  UserDatabaseRepository,
  UserForgotPasswordDatabaseRepository,
  UserModel,
} from '@zro/users/infrastructure';
import { UserFactory } from '@zro/test/users/config';

describe('UpdateUserPinUseCase', () => {
  let module: TestingModule;
  let userRepository: UserRepository;
  let userForgotPasswordRepository: UserForgotPasswordRepository;

  const eventEmitter: UserEventEmitter = createMock<UserEventEmitter>();
  const mockUpdatePinUserEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.updatePinUser),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    userRepository = new UserDatabaseRepository();
    userForgotPasswordRepository = new UserForgotPasswordDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  it('TC0001 - Should update user pin successfully', async () => {
    const user = await UserFactory.create<UserModel>(UserModel.name);

    const usecase = new UpdateUserPinUseCase(
      logger,
      userRepository,
      userForgotPasswordRepository,
      eventEmitter,
    );

    const pin = '1234';
    const userUpdated = await usecase.execute(user.uuid, '1234');

    expect(userUpdated).toBeDefined();
    expect(userUpdated.pin).toBe(pin);
    expect(mockUpdatePinUserEvent).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should not update user pin when not found', async () => {
    const usecase = new UpdateUserPinUseCase(
      logger,
      userRepository,
      userForgotPasswordRepository,
      eventEmitter,
    );
    const uuid = faker.datatype.uuid();
    const newPin = '1234';

    const testScript = () => usecase.execute(uuid, newPin);

    await expect(testScript).rejects.toThrow(UserNotFoundException);
    expect(mockUpdatePinUserEvent).toHaveBeenCalledTimes(0);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
