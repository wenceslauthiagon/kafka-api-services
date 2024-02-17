import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  UserForgotPasswordEntity,
  UserForgotPasswordRepository,
  UserForgotPasswordState,
  UserRepository,
} from '@zro/users/domain';
import {
  UpdateUserForgotPasswordUseCase as UseCase,
  UserForgotPasswordEventEmitter,
  UserForgotPasswordExpiredException,
  UserForgotPasswordInvalidStateException,
  UserForgotPasswordMaxAttemptsException,
  UserForgotPasswordNotFoundException,
} from '@zro/users/application';
import { UserForgotPasswordFactory } from '@zro/test/users/config';

describe('UpdateUserForgotPasswordUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const MAX_ATTEMPS = 3;
  const EXPIRATION_SECONDS = 600;

  const mockEmitter = () => {
    const eventEmitter: UserForgotPasswordEventEmitter =
      createMock<UserForgotPasswordEventEmitter>();
    const mockExpiredUserForgotPasswordEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.expired),
    );
    const mockDeclinedUserForgotPasswordEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.declined),
    );
    const mockConfirmedUserForgotPasswordEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.confirmed));

    return {
      eventEmitter,
      mockExpiredUserForgotPasswordEvent,
      mockDeclinedUserForgotPasswordEvent,
      mockConfirmedUserForgotPasswordEvent,
    };
  };

  const mockRepository = () => {
    const userForgotPasswordRepository: UserForgotPasswordRepository =
      createMock<UserForgotPasswordRepository>();
    const mockGetByIdRepository: jest.Mock = On(
      userForgotPasswordRepository,
    ).get(method((mock) => mock.getById));
    const mockUpdateRepository: jest.Mock = On(
      userForgotPasswordRepository,
    ).get(method((mock) => mock.update));

    const userRepository: UserRepository = createMock<UserRepository>();
    const mockGetByUuidRepository: jest.Mock = On(userRepository).get(
      method((mock) => mock.getByUuid),
    );
    const mockUpdateUserRepository: jest.Mock = On(userRepository).get(
      method((mock) => mock.update),
    );

    return {
      userRepository,
      mockGetByUuidRepository,
      mockUpdateUserRepository,
      userForgotPasswordRepository,
      mockGetByIdRepository,
      mockUpdateRepository,
    };
  };

  const makeSut = () => {
    const {
      userRepository,
      mockGetByUuidRepository,
      mockUpdateUserRepository,
      userForgotPasswordRepository,
      mockGetByIdRepository,
      mockUpdateRepository,
    } = mockRepository();

    const {
      eventEmitter,
      mockExpiredUserForgotPasswordEvent,
      mockDeclinedUserForgotPasswordEvent,
      mockConfirmedUserForgotPasswordEvent,
    } = mockEmitter();

    const sut = new UseCase(
      logger,
      userRepository,
      userForgotPasswordRepository,
      eventEmitter,
      MAX_ATTEMPS,
      EXPIRATION_SECONDS,
    );

    return {
      sut,
      mockGetByUuidRepository,
      mockUpdateUserRepository,
      mockGetByIdRepository,
      mockUpdateRepository,
      mockExpiredUserForgotPasswordEvent,
      mockDeclinedUserForgotPasswordEvent,
      mockConfirmedUserForgotPasswordEvent,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetByUuidRepository,
        mockUpdateUserRepository,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockExpiredUserForgotPasswordEvent,
        mockDeclinedUserForgotPasswordEvent,
        mockConfirmedUserForgotPasswordEvent,
      } = makeSut();

      const tests = [
        () => sut.execute(null, null, null),
        () => sut.execute(faker.datatype.uuid(), null, null),
        () => sut.execute(faker.datatype.uuid(), 'code', null),
        () => sut.execute(null, 'code', 'new_password'),
        () => sut.execute(null, 'code', null),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateUserRepository).toHaveBeenCalledTimes(0);
      expect(mockExpiredUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockDeclinedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not update if user forgot password not found', async () => {
      const {
        sut,
        mockGetByUuidRepository,
        mockUpdateUserRepository,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockExpiredUserForgotPasswordEvent,
        mockDeclinedUserForgotPasswordEvent,
        mockConfirmedUserForgotPasswordEvent,
      } = makeSut();

      const userForgotPassword =
        await UserForgotPasswordFactory.create<UserForgotPasswordEntity>(
          UserForgotPasswordEntity.name,
        );

      const { id, code } = userForgotPassword;

      mockGetByIdRepository.mockResolvedValue(null);

      const test = () => sut.execute(id, code, 'new_password');

      await expect(test).rejects.toThrow(UserForgotPasswordNotFoundException);

      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateUserRepository).toHaveBeenCalledTimes(0);
      expect(mockExpiredUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockDeclinedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not update if state is declined', async () => {
      const {
        sut,
        mockGetByUuidRepository,
        mockUpdateUserRepository,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockExpiredUserForgotPasswordEvent,
        mockDeclinedUserForgotPasswordEvent,
        mockConfirmedUserForgotPasswordEvent,
      } = makeSut();

      const userForgotPassword =
        await UserForgotPasswordFactory.create<UserForgotPasswordEntity>(
          UserForgotPasswordEntity.name,
          { state: UserForgotPasswordState.DECLINED },
        );

      const { id, code } = userForgotPassword;

      mockGetByIdRepository.mockResolvedValue(userForgotPassword);

      const test = () => sut.execute(id, code, 'new_password');

      await expect(test).rejects.toThrow(
        UserForgotPasswordMaxAttemptsException,
      );
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateUserRepository).toHaveBeenCalledTimes(0);
      expect(mockExpiredUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockDeclinedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not update if state is expired', async () => {
      const {
        sut,
        mockGetByUuidRepository,
        mockUpdateUserRepository,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockExpiredUserForgotPasswordEvent,
        mockDeclinedUserForgotPasswordEvent,
        mockConfirmedUserForgotPasswordEvent,
      } = makeSut();

      const userForgotPassword =
        await UserForgotPasswordFactory.create<UserForgotPasswordEntity>(
          UserForgotPasswordEntity.name,
          { state: UserForgotPasswordState.EXPIRED },
        );

      const { id, code } = userForgotPassword;

      mockGetByIdRepository.mockResolvedValue(userForgotPassword);

      const test = () => sut.execute(id, code, 'new_password');

      await expect(test).rejects.toThrow(UserForgotPasswordExpiredException);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateUserRepository).toHaveBeenCalledTimes(0);
      expect(mockExpiredUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockDeclinedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not update if state is invalid', async () => {
      const {
        sut,
        mockGetByUuidRepository,
        mockUpdateUserRepository,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockExpiredUserForgotPasswordEvent,
        mockDeclinedUserForgotPasswordEvent,
        mockConfirmedUserForgotPasswordEvent,
      } = makeSut();

      const userForgotPassword =
        await UserForgotPasswordFactory.create<UserForgotPasswordEntity>(
          UserForgotPasswordEntity.name,
          { state: UserForgotPasswordState.CONFIRMED },
        );

      const { id, code } = userForgotPassword;

      mockGetByIdRepository.mockResolvedValue(userForgotPassword);

      const test = () => sut.execute(id, code, 'new_password');

      await expect(test).rejects.toThrow(
        UserForgotPasswordInvalidStateException,
      );
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateUserRepository).toHaveBeenCalledTimes(0);
      expect(mockExpiredUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockDeclinedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not update if user forgot password is expired', async () => {
      const {
        sut,
        mockGetByUuidRepository,
        mockUpdateUserRepository,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockExpiredUserForgotPasswordEvent,
        mockDeclinedUserForgotPasswordEvent,
        mockConfirmedUserForgotPasswordEvent,
      } = makeSut();

      const userForgotPassword =
        await UserForgotPasswordFactory.create<UserForgotPasswordEntity>(
          UserForgotPasswordEntity.name,
          {
            state: UserForgotPasswordState.PENDING,
            createdAt: faker.date.past(),
          },
        );

      const { id, code } = userForgotPassword;

      mockGetByIdRepository.mockResolvedValue(userForgotPassword);

      const result = await sut.execute(id, code, 'new_password');

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.state).toBe(UserForgotPasswordState.EXPIRED);
      expect(result.attempts).toBe(0);
      expect(result.expiredAt).toBeDefined();
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateUserRepository).toHaveBeenCalledTimes(0);
      expect(mockExpiredUserForgotPasswordEvent).toHaveBeenCalledTimes(1);
      expect(mockDeclinedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not update if code is wrong', async () => {
      const {
        sut,
        mockGetByUuidRepository,
        mockUpdateUserRepository,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockExpiredUserForgotPasswordEvent,
        mockDeclinedUserForgotPasswordEvent,
        mockConfirmedUserForgotPasswordEvent,
      } = makeSut();

      const userForgotPassword =
        await UserForgotPasswordFactory.create<UserForgotPasswordEntity>(
          UserForgotPasswordEntity.name,
          {
            state: UserForgotPasswordState.PENDING,
            createdAt: faker.date.future(),
          },
        );

      const { id } = userForgotPassword;

      mockGetByIdRepository.mockResolvedValue(userForgotPassword);

      const result = await sut.execute(id, 'worng_code', 'new_password');

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.state).toBe(UserForgotPasswordState.PENDING);
      expect(result.attempts).toBe(1);
      expect(result.expiredAt).toBeUndefined();
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateUserRepository).toHaveBeenCalledTimes(0);
      expect(mockExpiredUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockDeclinedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should not update if code is wrong and is the last attempt', async () => {
      const {
        sut,
        mockGetByUuidRepository,
        mockUpdateUserRepository,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockExpiredUserForgotPasswordEvent,
        mockDeclinedUserForgotPasswordEvent,
        mockConfirmedUserForgotPasswordEvent,
      } = makeSut();

      const userForgotPassword =
        await UserForgotPasswordFactory.create<UserForgotPasswordEntity>(
          UserForgotPasswordEntity.name,
          {
            state: UserForgotPasswordState.PENDING,
            attempts: MAX_ATTEMPS - 1,
            createdAt: faker.date.future(),
          },
        );

      const { id } = userForgotPassword;

      mockGetByIdRepository.mockResolvedValue(userForgotPassword);

      const result = await sut.execute(id, 'wrong_code', 'new_password');

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.state).toBe(UserForgotPasswordState.DECLINED);
      expect(result.attempts).toBe(MAX_ATTEMPS);
      expect(result.expiredAt).toBeUndefined();
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateUserRepository).toHaveBeenCalledTimes(0);
      expect(mockExpiredUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockDeclinedUserForgotPasswordEvent).toHaveBeenCalledTimes(1);
      expect(mockConfirmedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0009 - Should update successfully', async () => {
      const {
        sut,
        mockGetByUuidRepository,
        mockUpdateUserRepository,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockExpiredUserForgotPasswordEvent,
        mockDeclinedUserForgotPasswordEvent,
        mockConfirmedUserForgotPasswordEvent,
      } = makeSut();

      const userForgotPassword =
        await UserForgotPasswordFactory.create<UserForgotPasswordEntity>(
          UserForgotPasswordEntity.name,
          {
            state: UserForgotPasswordState.PENDING,
            createdAt: faker.date.future(),
          },
        );

      const { id, code, user } = userForgotPassword;

      mockGetByIdRepository.mockResolvedValue(userForgotPassword);

      const result = await sut.execute(id, code, 'new_password');

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.state).toBe(UserForgotPasswordState.CONFIRMED);
      expect(result.attempts).toBe(1);
      expect(result.expiredAt).toBeUndefined();
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByUuidRepository).toHaveBeenCalledWith(user.uuid);
      expect(mockUpdateUserRepository).toHaveBeenCalledTimes(1);
      expect(mockExpiredUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockDeclinedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedUserForgotPasswordEvent).toHaveBeenCalledTimes(1);
    });
  });
});
