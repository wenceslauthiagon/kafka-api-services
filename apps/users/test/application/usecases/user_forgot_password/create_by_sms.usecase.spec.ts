import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  UserEntity,
  UserForgotPasswordEntity,
  UserForgotPasswordRepository,
  UserForgotPasswordState,
  UserRepository,
} from '@zro/users/domain';
import {
  CreateUserForgotPasswordBySmsUseCase as UseCase,
  NotificationService,
  UserForgotPasswordEventEmitter,
} from '@zro/users/application';
import { UserFactory, UserForgotPasswordFactory } from '@zro/test/users/config';

describe('CreateUserForgotPasswordUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const SMS_TAG = 'teste';

  const mockEmitter = () => {
    const eventEmitter: UserForgotPasswordEventEmitter =
      createMock<UserForgotPasswordEventEmitter>();
    const mockCreatedUserForgotPasswordEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.created),
    );

    return {
      eventEmitter,
      mockCreatedUserForgotPasswordEvent,
    };
  };

  const mockService = () => {
    const notificationService: NotificationService =
      createMock<NotificationService>();
    const mockSendSms: jest.Mock = On(notificationService).get(
      method((mock) => mock.sendSms),
    );

    return {
      notificationService,
      mockSendSms,
    };
  };

  const mockRepository = () => {
    const userForgotPasswordRepository: UserForgotPasswordRepository =
      createMock<UserForgotPasswordRepository>();
    const mockGetByIdRepository: jest.Mock = On(
      userForgotPasswordRepository,
    ).get(method((mock) => mock.getById));
    const mockGetByUserRepository: jest.Mock = On(
      userForgotPasswordRepository,
    ).get(method((mock) => mock.getByUserAndState));
    const mockUpdateRepository: jest.Mock = On(
      userForgotPasswordRepository,
    ).get(method((mock) => mock.update));
    const mockCreateRepository: jest.Mock = On(
      userForgotPasswordRepository,
    ).get(method((mock) => mock.create));

    const userRepository: UserRepository = createMock<UserRepository>();
    const mockGetByPhoneNumberRepository: jest.Mock = On(userRepository).get(
      method((mock) => mock.getByPhoneNumber),
    );

    return {
      userRepository,
      mockGetByPhoneNumberRepository,
      userForgotPasswordRepository,
      mockGetByIdRepository,
      mockGetByUserRepository,
      mockUpdateRepository,
      mockCreateRepository,
    };
  };

  const makeSut = () => {
    const {
      userRepository,
      mockGetByPhoneNumberRepository,
      userForgotPasswordRepository,
      mockGetByIdRepository,
      mockGetByUserRepository,
      mockUpdateRepository,
      mockCreateRepository,
    } = mockRepository();

    const { eventEmitter, mockCreatedUserForgotPasswordEvent } = mockEmitter();

    const { notificationService, mockSendSms } = mockService();

    const sut = new UseCase(
      logger,
      userRepository,
      userForgotPasswordRepository,
      eventEmitter,
      notificationService,
      SMS_TAG,
    );

    return {
      sut,
      mockGetByPhoneNumberRepository,
      mockGetByIdRepository,
      mockGetByUserRepository,
      mockUpdateRepository,
      mockCreateRepository,
      mockCreatedUserForgotPasswordEvent,
      mockSendSms,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if missing params', async () => {
      const {
        sut,
        mockGetByPhoneNumberRepository,
        mockGetByIdRepository,
        mockGetByUserRepository,
        mockUpdateRepository,
        mockCreateRepository,
        mockCreatedUserForgotPasswordEvent,
        mockSendSms,
      } = makeSut();

      const tests = [
        () => sut.execute(null, null),
        () => sut.execute(null, faker.datatype.uuid()),
        () => sut.execute(new UserEntity({}), null),
        () =>
          sut.execute(new UserEntity({ phoneNumber: 'phone_number' }), null),
        () => sut.execute(new UserEntity({}), faker.datatype.uuid()),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByPhoneNumberRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByUserRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockSendSms).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create if user not found', async () => {
      const {
        sut,
        mockGetByPhoneNumberRepository,
        mockGetByIdRepository,
        mockGetByUserRepository,
        mockUpdateRepository,
        mockCreateRepository,
        mockCreatedUserForgotPasswordEvent,
        mockSendSms,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const id = faker.datatype.uuid();

      const { phoneNumber } = user;

      mockGetByPhoneNumberRepository.mockResolvedValue(null);

      const result = await sut.execute(new UserEntity({ phoneNumber }), id);

      expect(result).toBeUndefined();
      expect(mockGetByPhoneNumberRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByPhoneNumberRepository).toHaveBeenCalledWith(phoneNumber);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByUserRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockSendSms).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create if id already exists', async () => {
      const {
        sut,
        mockGetByPhoneNumberRepository,
        mockGetByIdRepository,
        mockGetByUserRepository,
        mockUpdateRepository,
        mockCreateRepository,
        mockCreatedUserForgotPasswordEvent,
        mockSendSms,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const userForgotPassword =
        await UserForgotPasswordFactory.create<UserForgotPasswordEntity>(
          UserForgotPasswordEntity.name,
          { user },
        );

      const { id } = userForgotPassword;
      const { phoneNumber } = user;

      mockGetByPhoneNumberRepository.mockResolvedValue(user);
      mockGetByIdRepository.mockResolvedValue(userForgotPassword);

      const result = await sut.execute(new UserEntity({ phoneNumber }), id);

      expect(result).toBeUndefined();
      expect(mockGetByPhoneNumberRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByPhoneNumberRepository).toHaveBeenCalledWith(phoneNumber);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockGetByUserRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedUserForgotPasswordEvent).toHaveBeenCalledTimes(0);
      expect(mockSendSms).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should create successfully if already exists user forgot password', async () => {
      const {
        sut,
        mockGetByPhoneNumberRepository,
        mockGetByIdRepository,
        mockGetByUserRepository,
        mockUpdateRepository,
        mockCreateRepository,
        mockCreatedUserForgotPasswordEvent,
        mockSendSms,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const oldUserForgotPassword =
        await UserForgotPasswordFactory.create<UserForgotPasswordEntity>(
          UserForgotPasswordEntity.name,
          { user },
        );
      const newUserForgotPassword =
        await UserForgotPasswordFactory.create<UserForgotPasswordEntity>(
          UserForgotPasswordEntity.name,
          { user, state: UserForgotPasswordState.PENDING },
        );

      const { id } = newUserForgotPassword;
      const { phoneNumber } = user;

      mockGetByPhoneNumberRepository.mockResolvedValue(user);
      mockGetByIdRepository.mockResolvedValue(null);
      mockGetByUserRepository.mockResolvedValue(oldUserForgotPassword);
      mockCreateRepository.mockResolvedValue(newUserForgotPassword);

      const result = await sut.execute(new UserEntity({ phoneNumber }), id);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.state).toBe(UserForgotPasswordState.PENDING);
      expect(result.user.uuid).toBe(user.uuid);
      expect(result.code).toBe(newUserForgotPassword.code);
      expect(result.attempts).toBe(0);
      expect(mockGetByPhoneNumberRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByPhoneNumberRepository).toHaveBeenCalledWith(phoneNumber);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockGetByUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByUserRepository).toHaveBeenCalledWith(
        user,
        UserForgotPasswordState.PENDING,
      );
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatedUserForgotPasswordEvent).toHaveBeenCalledTimes(1);
      expect(mockSendSms).toHaveBeenCalledTimes(1);
      expect(mockSendSms).toHaveBeenCalledWith(newUserForgotPassword, SMS_TAG);
    });

    it('TC0005 - Should create successfully if not exists user forgot password', async () => {
      const {
        sut,
        mockGetByPhoneNumberRepository,
        mockGetByIdRepository,
        mockGetByUserRepository,
        mockUpdateRepository,
        mockCreateRepository,
        mockCreatedUserForgotPasswordEvent,
        mockSendSms,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const userForgotPassword =
        await UserForgotPasswordFactory.create<UserForgotPasswordEntity>(
          UserForgotPasswordEntity.name,
          { user, state: UserForgotPasswordState.PENDING },
        );

      const { id } = userForgotPassword;
      const { phoneNumber } = user;

      mockGetByPhoneNumberRepository.mockResolvedValue(user);
      mockGetByIdRepository.mockResolvedValue(null);
      mockGetByUserRepository.mockResolvedValue(null);
      mockCreateRepository.mockResolvedValue(userForgotPassword);

      const result = await sut.execute(new UserEntity({ phoneNumber }), id);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.state).toBe(UserForgotPasswordState.PENDING);
      expect(result.user.uuid).toBe(user.uuid);
      expect(result.code).toBe(userForgotPassword.code);
      expect(result.attempts).toBe(0);
      expect(mockGetByPhoneNumberRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByPhoneNumberRepository).toHaveBeenCalledWith(phoneNumber);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockGetByUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByUserRepository).toHaveBeenCalledWith(
        user,
        UserForgotPasswordState.PENDING,
      );
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatedUserForgotPasswordEvent).toHaveBeenCalledTimes(1);
      expect(mockSendSms).toHaveBeenCalledTimes(1);
      expect(mockSendSms).toHaveBeenCalledWith(userForgotPassword, SMS_TAG);
    });
  });
});
