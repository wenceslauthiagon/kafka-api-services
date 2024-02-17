import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  UserEntity,
  UserPinAttemptsRepository,
  UserRepository,
} from '@zro/users/domain';
import {
  UpdateUserPinAttemptsUseCase as UseCase,
  UserNotFoundException,
  UserPinAttemptsEventEmitter,
} from '@zro/users/application';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import {
  UserPinAttemptsDatabaseRepository,
  UserPinAttemptsModel,
  UserModel,
  UserDatabaseRepository,
} from '@zro/users/infrastructure';
import { UserPinAttemptsFactory, UserFactory } from '@zro/test/users/config';

describe('UpdateUserPinAttemptsByUserUseCase', () => {
  let module: TestingModule;
  let userRepository: UserRepository;
  let userPinAttemptsRepository: UserPinAttemptsRepository;

  const userPixAttemptsEventEmitter: UserPinAttemptsEventEmitter =
    createMock<UserPinAttemptsEventEmitter>();
  const mockUpdatedUserPinAttemptsEvent: jest.Mock = On(
    userPixAttemptsEventEmitter,
  ).get(method((mock) => mock.updatedUserPinAttempts));

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    userRepository = new UserDatabaseRepository();
    userPinAttemptsRepository = new UserPinAttemptsDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  it('TC0001 - Should update userPinAttempts successfully', async () => {
    const user = await UserFactory.create<UserModel>(UserModel.name);
    const userPinAttempts =
      await UserPinAttemptsFactory.create<UserPinAttemptsModel>(
        UserPinAttemptsModel.name,
        { attempts: 5, userId: user.id },
      );

    const usecase = new UseCase(
      logger,
      userRepository,
      userPinAttemptsRepository,
      userPixAttemptsEventEmitter,
    );

    const foundUserPinAttempts = await usecase.execute(user, 10);

    expect(foundUserPinAttempts).toBeDefined();
    expect(foundUserPinAttempts.id).toBe(userPinAttempts.id);
    expect(foundUserPinAttempts.attempts).toBe(10);
    expect(foundUserPinAttempts.user.id).toBe(user.id);

    expect(mockUpdatedUserPinAttemptsEvent).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should update a not existing userPinAttempts', async () => {
    const user = await UserFactory.create<UserModel>(UserModel.name);

    const usecase = new UseCase(
      logger,
      userRepository,
      userPinAttemptsRepository,
      userPixAttemptsEventEmitter,
    );

    const foundUserPinAttempts = await usecase.execute(user, 10);

    expect(foundUserPinAttempts).toBeDefined();
    expect(foundUserPinAttempts.id).toBeDefined();
    expect(foundUserPinAttempts.attempts).toBe(10);
    expect(foundUserPinAttempts.user.id).toBe(user.id);

    expect(mockUpdatedUserPinAttemptsEvent).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should not update with invalid user', async () => {
    const usecase = new UseCase(
      logger,
      userRepository,
      userPinAttemptsRepository,
      userPixAttemptsEventEmitter,
    );

    await expect(() => usecase.execute(null, 10)).rejects.toThrow(
      MissingDataException,
    );

    expect(mockUpdatedUserPinAttemptsEvent).toHaveBeenCalledTimes(0);
  });

  it('TC0004 - Should not update not existing user', async () => {
    const usecase = new UseCase(
      logger,
      userRepository,
      userPinAttemptsRepository,
      userPixAttemptsEventEmitter,
    );

    await expect(() =>
      usecase.execute(new UserEntity({ uuid: uuidV4() }), 10),
    ).rejects.toThrow(UserNotFoundException);

    expect(mockUpdatedUserPinAttemptsEvent).toHaveBeenCalledTimes(0);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
