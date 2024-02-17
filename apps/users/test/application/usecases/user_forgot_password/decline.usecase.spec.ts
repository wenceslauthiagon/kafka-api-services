import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  UserEntity,
  UserForgotPasswordEntity,
  UserForgotPasswordRepository,
  UserForgotPasswordState,
} from '@zro/users/domain';
import {
  DeclineUserForgotPasswordUseCase as UseCase,
  UserForgotPasswordNotFoundException,
  UserForgotPasswordInvalidStateException,
  UserForgotPasswordEventEmitter,
} from '@zro/users/application';
import { UserFactory, UserForgotPasswordFactory } from '@zro/test/users/config';

describe('DeclineUserForgotPasswordUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockEmitter = () => {
    const eventEmitter: UserForgotPasswordEventEmitter =
      createMock<UserForgotPasswordEventEmitter>();
    const mockDeclinedUserForgotPasswordEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.declined),
    );

    return {
      eventEmitter,
      mockDeclinedUserForgotPasswordEvent,
    };
  };

  const mockRepository = () => {
    const userForgotPasswordRepository: UserForgotPasswordRepository =
      createMock<UserForgotPasswordRepository>();
    const mockGetByIdAndUserRepository: jest.Mock = On(
      userForgotPasswordRepository,
    ).get(method((mock) => mock.getByIdAndUser));
    const mockUpdateRepository: jest.Mock = On(
      userForgotPasswordRepository,
    ).get(method((mock) => mock.update));

    return {
      userForgotPasswordRepository,
      mockGetByIdAndUserRepository,
      mockUpdateRepository,
    };
  };

  const makeSut = () => {
    const {
      userForgotPasswordRepository,
      mockGetByIdAndUserRepository,
      mockUpdateRepository,
    } = mockRepository();

    const { eventEmitter, mockDeclinedUserForgotPasswordEvent } = mockEmitter();

    const sut = new UseCase(logger, userForgotPasswordRepository, eventEmitter);

    return {
      sut,
      mockGetByIdAndUserRepository,
      mockUpdateRepository,
      mockDeclinedUserForgotPasswordEvent,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not decline if missing params', async () => {
      const {
        sut,
        mockGetByIdAndUserRepository,
        mockUpdateRepository,
        mockDeclinedUserForgotPasswordEvent,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const tests = [
        () => sut.execute(null, null),
        () => sut.execute(faker.datatype.uuid(), null),
        () => sut.execute(null, user),
        () => sut.execute(faker.datatype.uuid(), new UserEntity({})),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByIdAndUserRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockDeclinedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not decline if user forgot password not found', async () => {
      const {
        sut,
        mockGetByIdAndUserRepository,
        mockUpdateRepository,
        mockDeclinedUserForgotPasswordEvent,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const id = faker.datatype.uuid();

      mockGetByIdAndUserRepository.mockResolvedValueOnce(null);

      const test = () => sut.execute(id, user);

      await expect(test).rejects.toThrow(UserForgotPasswordNotFoundException);

      expect(mockGetByIdAndUserRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockDeclinedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not decline if state is invalid', async () => {
      const {
        sut,
        mockGetByIdAndUserRepository,
        mockUpdateRepository,
        mockDeclinedUserForgotPasswordEvent,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const userForgotPassword =
        await UserForgotPasswordFactory.create<UserForgotPasswordEntity>(
          UserForgotPasswordEntity.name,
          { user, state: UserForgotPasswordState.CONFIRMED },
        );
      const { id } = userForgotPassword;

      mockGetByIdAndUserRepository.mockResolvedValueOnce(userForgotPassword);

      const test = () => sut.execute(id, user);

      await expect(test).rejects.toThrow(
        UserForgotPasswordInvalidStateException,
      );

      expect(mockGetByIdAndUserRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockDeclinedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should decline successfully', async () => {
      const {
        sut,
        mockGetByIdAndUserRepository,
        mockUpdateRepository,
        mockDeclinedUserForgotPasswordEvent,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const userForgotPassword =
        await UserForgotPasswordFactory.create<UserForgotPasswordEntity>(
          UserForgotPasswordEntity.name,
          { user, state: UserForgotPasswordState.PENDING },
        );
      const { id } = userForgotPassword;

      mockGetByIdAndUserRepository.mockResolvedValueOnce(userForgotPassword);

      await sut.execute(id, user);

      expect(mockGetByIdAndUserRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockDeclinedUserForgotPasswordEvent).toHaveBeenCalledTimes(1);
    });
  });
});
