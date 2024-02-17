import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import * as bcrypt from 'bcrypt';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { UserEntity, UserRepository, UserState } from '@zro/users/domain';
import {
  CreateUserUseCase as UseCase,
  HashProvider,
  UserAlreadyExistsException,
  UserEventEmitter,
} from '@zro/users/application';
import { UserFactory } from '@zro/test/users/config';

describe('CreateUserUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const hashProvider: HashProvider = createMock<HashProvider>();
    const mockHashSync: jest.Mock = On(hashProvider).get(
      method((mock) => mock.hashSync),
    );
    const {
      userRepository,
      mockCreateUserRepository,
      mockGetByPhoneNumberRepository,
      mockGetByReferralCodeRepository,
      mockGetByEmailRepository,
    } = mockRepository();
    const { eventEmitter, mockCreatedUserEvent } = mockEmitter();

    const sut = new UseCase(logger, userRepository, hashProvider, eventEmitter);
    return {
      sut,
      mockCreateUserRepository,
      mockGetByPhoneNumberRepository,
      mockGetByReferralCodeRepository,
      mockCreatedUserEvent,
      mockHashSync,
      mockGetByEmailRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: UserEventEmitter = createMock<UserEventEmitter>();
    const mockCreatedUserEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.pendingUser),
    );

    return {
      eventEmitter,
      mockCreatedUserEvent,
    };
  };

  const mockRepository = () => {
    const userRepository: UserRepository = createMock<UserRepository>();
    const mockCreateUserRepository: jest.Mock = On(userRepository).get(
      method((mock) => mock.create),
    );
    const mockGetByPhoneNumberRepository: jest.Mock = On(userRepository).get(
      method((mock) => mock.getByPhoneNumber),
    );
    const mockGetByReferralCodeRepository: jest.Mock = On(userRepository).get(
      method((mock) => mock.getByReferralCode),
    );
    const mockGetByEmailRepository: jest.Mock = On(userRepository).get(
      method((mock) => mock.getByEmail),
    );

    return {
      userRepository,
      mockCreateUserRepository,
      mockGetByPhoneNumberRepository,
      mockGetByReferralCodeRepository,
      mockGetByEmailRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create user if missing params', async () => {
      const {
        sut,
        mockCreateUserRepository,
        mockGetByPhoneNumberRepository,
        mockGetByReferralCodeRepository,
        mockCreatedUserEvent,
        mockHashSync,
        mockGetByEmailRepository,
      } = makeSut();

      const test = [
        () => sut.execute(null, null, null, null, null, null, null),
        () =>
          sut.execute(
            faker.datatype.uuid(),
            null,
            null,
            null,
            null,
            null,
            null,
          ),
        () =>
          sut.execute(
            null,
            faker.name.firstName(),
            null,
            null,
            null,
            null,
            null,
          ),
        () => sut.execute(null, null, '5511988776655', null, null, null, null),
        () =>
          sut.execute(
            null,
            null,
            null,
            '$2a$32$56dUfdhB1XvYg0B1KgUU/uWCUsJ3nrC7N0W0.RmCYIMcDbIzafV/.',
            null,
            null,
            null,
          ),
        () => sut.execute(null, null, null, null, '12345', null, null),
        () => sut.execute(null, null, null, null, null, 'joao@jose.com', null),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(mockCreateUserRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByPhoneNumberRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByReferralCodeRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedUserEvent).toHaveBeenCalledTimes(0);
      expect(mockHashSync).toHaveBeenCalledTimes(0);
      expect(mockGetByEmailRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create user with same phone number (dup phone)', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        phoneNumber: '5511988776655',
        state: UserState.ACTIVE,
      });
      const {
        sut,
        mockCreateUserRepository,
        mockGetByPhoneNumberRepository,
        mockGetByReferralCodeRepository,
        mockCreatedUserEvent,
        mockHashSync,
        mockGetByEmailRepository,
      } = makeSut();

      mockGetByPhoneNumberRepository.mockResolvedValue(user);
      mockCreateUserRepository.mockImplementationOnce((user) => user);
      mockHashSync.mockImplementation((password, salt) =>
        bcrypt.hashSync(password, salt),
      );

      await expect(
        sut.execute(
          faker.datatype.uuid(),
          faker.name.firstName(),
          '5511988776655',
          '$2a$32$56dUfdhB1XvYg0B1KgUU/uWCUsJ3nrC7N0W0.RmCYIMcDbIzafV/.',
          faker.datatype.number(99999).toString(),
          'a@b.c',
          null,
        ),
      ).rejects.toThrow(UserAlreadyExistsException);

      expect(mockCreateUserRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByPhoneNumberRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByReferralCodeRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedUserEvent).toHaveBeenCalledTimes(0);
      expect(mockHashSync).toHaveBeenCalledTimes(0);
      expect(mockGetByEmailRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should create user successfully without referral code', async () => {
      const {
        sut,
        mockCreateUserRepository,
        mockGetByPhoneNumberRepository,
        mockGetByReferralCodeRepository,
        mockCreatedUserEvent,
        mockHashSync,
        mockGetByEmailRepository,
      } = makeSut();

      mockGetByPhoneNumberRepository.mockResolvedValue(null);
      mockGetByEmailRepository.mockResolvedValue(null);
      mockCreateUserRepository.mockImplementationOnce((user) => user);
      mockHashSync.mockImplementation((password, salt) =>
        bcrypt.hashSync(password, salt),
      );

      const createdUser = await sut.execute(
        faker.datatype.uuid(),
        faker.name.firstName(),
        '5511988776655',
        '$2a$32$56dUfdhB1XvYg0B1KgUU/uWCUsJ3nrC7N0W0.RmCYIMcDbIzafV/.',
        faker.datatype.number(99999).toString(),
        'a@b.c',
        null,
      );

      expect(createdUser).toBeDefined();
      expect(createdUser.referredBy).toBeNull();
      expect(mockCreateUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByPhoneNumberRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByReferralCodeRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedUserEvent).toHaveBeenCalledTimes(1);
      expect(mockHashSync).toHaveBeenCalledTimes(1);
      expect(mockGetByEmailRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should create user successfully with referral code', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        referralCode: 'XY123',
      });
      const {
        sut,
        mockCreateUserRepository,
        mockGetByPhoneNumberRepository,
        mockGetByReferralCodeRepository,
        mockCreatedUserEvent,
        mockHashSync,
        mockGetByEmailRepository,
      } = makeSut();

      mockGetByPhoneNumberRepository.mockResolvedValue(null);
      mockGetByEmailRepository.mockResolvedValue(null);
      mockGetByReferralCodeRepository.mockReturnValueOnce(user);
      mockCreateUserRepository.mockImplementationOnce((user) => user);
      mockHashSync.mockImplementation((password, salt) =>
        bcrypt.hashSync(password, salt),
      );

      const createdUser = await sut.execute(
        faker.datatype.uuid(),
        faker.name.firstName(),
        '5511988776655',
        '$2a$32$56dUfdhB1XvYg0B1KgUU/uWCUsJ3nrC7N0W0.RmCYIMcDbIzafV/.',
        faker.datatype.number(99999).toString(),
        'a@b.c',
        'XY123',
      );

      expect(createdUser).toBeDefined();
      expect(createdUser.referredBy.id).toBe(user.id);
      expect(mockCreateUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByPhoneNumberRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByReferralCodeRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatedUserEvent).toHaveBeenCalledTimes(1);
      expect(mockHashSync).toHaveBeenCalledTimes(1);
      expect(mockGetByEmailRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should create user if another user with same phone number is not active', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        phoneNumber: '5511988776655',
        state: UserState.PENDING,
      });
      const {
        sut,
        mockCreateUserRepository,
        mockGetByPhoneNumberRepository,
        mockGetByReferralCodeRepository,
        mockCreatedUserEvent,
        mockHashSync,
        mockGetByEmailRepository,
      } = makeSut();

      mockGetByEmailRepository.mockResolvedValue(null);
      mockGetByPhoneNumberRepository.mockResolvedValue(user);
      mockCreateUserRepository.mockImplementationOnce((user) => user);
      mockHashSync.mockImplementation((password, salt) =>
        bcrypt.hashSync(password, salt),
      );

      await sut.execute(
        faker.datatype.uuid(),
        faker.name.firstName(),
        '5511988776655',
        '$2a$32$56dUfdhB1XvYg0B1KgUU/uWCUsJ3nrC7N0W0.RmCYIMcDbIzafV/.',
        faker.datatype.number(99999).toString(),
        'a@b.c',
        null,
      );

      expect(mockCreateUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByPhoneNumberRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByReferralCodeRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedUserEvent).toHaveBeenCalledTimes(1);
      expect(mockHashSync).toHaveBeenCalledTimes(1);
      expect(mockGetByEmailRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should create user if another user has same email', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        phoneNumber: '5511988776655',
        email: '123@321.com',
      });
      const {
        sut,
        mockCreateUserRepository,
        mockGetByPhoneNumberRepository,
        mockGetByReferralCodeRepository,
        mockCreatedUserEvent,
        mockHashSync,
        mockGetByEmailRepository,
      } = makeSut();

      mockGetByEmailRepository.mockResolvedValue(user);
      mockGetByPhoneNumberRepository.mockResolvedValue(null);
      mockCreateUserRepository.mockImplementationOnce((user) => user);
      mockHashSync.mockImplementation((password, salt) =>
        bcrypt.hashSync(password, salt),
      );

      await sut.execute(
        faker.datatype.uuid(),
        faker.name.firstName(),
        '5511988776655',
        '$2a$32$56dUfdhB1XvYg0B1KgUU/uWCUsJ3nrC7N0W0.RmCYIMcDbIzafV/.',
        faker.datatype.number(99999).toString(),
        '123@321.com',
        null,
      );

      expect(mockCreateUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByPhoneNumberRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByReferralCodeRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedUserEvent).toHaveBeenCalledTimes(1);
      expect(mockHashSync).toHaveBeenCalledTimes(1);
      expect(mockGetByEmailRepository).toHaveBeenCalledTimes(1);
    });
  });
});
