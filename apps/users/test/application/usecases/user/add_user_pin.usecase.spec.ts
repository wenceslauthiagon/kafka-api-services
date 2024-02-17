import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { UserRepository } from '@zro/users/domain';
import {
  AddUserPinUseCase,
  UserEventEmitter,
  UserNotFoundException,
  UserPinAlreadyExistsException,
} from '@zro/users/application';
import { UserDatabaseRepository, UserModel } from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserFactory } from '@zro/test/users/config';

describe('AddUserPinUseCase', () => {
  let module: TestingModule;
  let userRepository: UserRepository;

  const eventEmitter: UserEventEmitter = createMock<UserEventEmitter>();
  const mockAddPinUserEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.addPinUser),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    userRepository = new UserDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  it('TC0001 - Should update user pin successfully', async () => {
    const user = await UserFactory.create<UserModel>(UserModel.name, {
      pinHasCreated: false,
    });

    const usecase = new AddUserPinUseCase(logger, userRepository, eventEmitter);

    const pin = '1234';
    const userAddd = await usecase.execute(user.uuid, pin);

    expect(userAddd).toBeDefined();
    expect(userAddd.pin).toBe(pin);
    expect(mockAddPinUserEvent).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should not update user pin when not found', async () => {
    const usecase = new AddUserPinUseCase(logger, userRepository, eventEmitter);
    const uuid = faker.datatype.uuid();
    const newPin = '1234';

    const testScript = () => usecase.execute(uuid, newPin);

    await expect(testScript).rejects.toThrow(UserNotFoundException);
    expect(mockAddPinUserEvent).toHaveBeenCalledTimes(0);
  });

  it('TC0003 - Should not update user pin when pin already has created', async () => {
    const user = await UserFactory.create<UserModel>(UserModel.name, {
      pinHasCreated: true,
    });

    const usecase = new AddUserPinUseCase(logger, userRepository, eventEmitter);

    const newPin = '1234';
    const testScript = () => usecase.execute(user.uuid, newPin);

    await expect(testScript).rejects.toThrow(UserPinAlreadyExistsException);
    expect(mockAddPinUserEvent).toHaveBeenCalledTimes(0);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
