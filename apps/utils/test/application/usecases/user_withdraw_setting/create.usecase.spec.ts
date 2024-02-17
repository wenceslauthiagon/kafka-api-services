import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { KeyType, PixKeyEntity } from '@zro/pix-keys/domain';
import {
  UserWithdrawSettingEntity,
  WithdrawSettingType,
  WithdrawSettingWeekDays,
  UserWithdrawSettingRepository,
} from '@zro/utils/domain';
import { TransactionTypeEntity, WalletEntity } from '@zro/operations/domain';
import { CreateUserWithdrawSettingUseCase as UseCase } from '@zro/utils/application';
import { UserWithdrawSettingEventEmitter } from '@zro/utils/application';
import { UserWithdrawSettingFactory } from '@zro/test/utils/config';

describe('CreateUserWithdrawSettingUseCase', () => {
  const mockEmitter = () => {
    const eventEmitter: UserWithdrawSettingEventEmitter =
      createMock<UserWithdrawSettingEventEmitter>();

    const mockCreatedUserWithdrawSettingEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.created),
    );

    return {
      eventEmitter,
      mockCreatedUserWithdrawSettingEvent,
    };
  };

  const mockRepository = () => {
    const userWithdrawSettingRepository: UserWithdrawSettingRepository =
      createMock<UserWithdrawSettingRepository>();

    const mockGetUserWithdrawSettingRepository: jest.Mock = On(
      userWithdrawSettingRepository,
    ).get(method((mock) => mock.getById));

    const mockCreateUserWithdrawSettingRepository: jest.Mock = On(
      userWithdrawSettingRepository,
    ).get(method((mock) => mock.create));

    return {
      userWithdrawSettingRepository,
      mockCreateUserWithdrawSettingRepository,
      mockGetUserWithdrawSettingRepository,
    };
  };

  const makeSut = () => {
    const {
      userWithdrawSettingRepository,
      mockGetUserWithdrawSettingRepository,
      mockCreateUserWithdrawSettingRepository,
    } = mockRepository();

    const { eventEmitter, mockCreatedUserWithdrawSettingEvent } = mockEmitter();

    const sut = new UseCase(
      logger,
      userWithdrawSettingRepository,
      eventEmitter,
    );

    return {
      sut,
      mockGetUserWithdrawSettingRepository,
      mockCreateUserWithdrawSettingRepository,
      mockCreatedUserWithdrawSettingEvent,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if missing params', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRepository,
        mockCreateUserWithdrawSettingRepository,
        mockCreatedUserWithdrawSettingEvent,
      } = makeSut();

      const test = [
        () => sut.execute(null, null, null, null, null, null, null, null, null),
        () =>
          sut.execute(
            faker.datatype.uuid(),
            WithdrawSettingType.BALANCE,
            faker.datatype.number({ min: 1, max: 9999999 }),
            null,
            null,
            new WalletEntity({}),
            new UserEntity({}),
            new TransactionTypeEntity({}),
            new PixKeyEntity({}),
          ),
        () =>
          sut.execute(
            faker.datatype.uuid(),
            WithdrawSettingType.MONTHLY,
            faker.datatype.number({ min: 1, max: 9999999 }),
            null,
            null,
            new WalletEntity({ uuid: faker.datatype.uuid() }),
            new UserEntity({ uuid: faker.datatype.uuid() }),
            new TransactionTypeEntity({ tag: faker.datatype.string() }),
            new PixKeyEntity({ type: KeyType.EMAIL, key: 'teste@mail.com' }),
          ),
        () =>
          sut.execute(
            faker.datatype.uuid(),
            WithdrawSettingType.WEEKLY,
            faker.datatype.number({ min: 1, max: 9999999 }),
            null,
            null,
            new WalletEntity({ uuid: faker.datatype.uuid() }),
            new UserEntity({ uuid: faker.datatype.uuid() }),
            new TransactionTypeEntity({ tag: faker.datatype.string() }),
            new PixKeyEntity({ type: KeyType.EMAIL, key: 'teste@mail.com' }),
          ),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(mockGetUserWithdrawSettingRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateUserWithdrawSettingRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedUserWithdrawSettingEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create if with same id already exists', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRepository,
        mockCreateUserWithdrawSettingRepository,
        mockCreatedUserWithdrawSettingEvent,
      } = makeSut();

      const userWithdrawSetting =
        await UserWithdrawSettingFactory.create<UserWithdrawSettingEntity>(
          UserWithdrawSettingEntity.name,
          { type: WithdrawSettingType.BALANCE },
        );

      mockGetUserWithdrawSettingRepository.mockResolvedValue(
        userWithdrawSetting,
      );

      const result = await sut.execute(
        userWithdrawSetting.id,
        userWithdrawSetting.type,
        userWithdrawSetting.balance,
        userWithdrawSetting.day,
        userWithdrawSetting.weekDay,
        userWithdrawSetting.wallet,
        userWithdrawSetting.user,
        userWithdrawSetting.transactionType,
        userWithdrawSetting.pixKey,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(userWithdrawSetting.id);
      expect(result.type).toBe(userWithdrawSetting.type);
      expect(result.balance).toBe(userWithdrawSetting.balance);
      expect(mockGetUserWithdrawSettingRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserWithdrawSettingRepository).toHaveBeenCalledWith(
        userWithdrawSetting.id,
      );
      expect(mockCreateUserWithdrawSettingRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedUserWithdrawSettingEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should create balance user withdraw setting request successfully', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRepository,
        mockCreateUserWithdrawSettingRepository,
        mockCreatedUserWithdrawSettingEvent,
      } = makeSut();

      const userWithdrawSetting =
        await UserWithdrawSettingFactory.create<UserWithdrawSettingEntity>(
          UserWithdrawSettingEntity.name,
          {
            type: WithdrawSettingType.BALANCE,
          },
        );

      mockGetUserWithdrawSettingRepository.mockResolvedValue(null);
      mockCreateUserWithdrawSettingRepository.mockResolvedValue(
        userWithdrawSetting,
      );

      const result = await sut.execute(
        userWithdrawSetting.id,
        userWithdrawSetting.type,
        userWithdrawSetting.balance,
        null,
        null,
        userWithdrawSetting.wallet,
        userWithdrawSetting.user,
        userWithdrawSetting.transactionType,
        userWithdrawSetting.pixKey,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(userWithdrawSetting.id);
      expect(result.wallet).toBe(userWithdrawSetting.wallet);
      expect(result.user).toBe(userWithdrawSetting.user);
      expect(result.transactionType).toBe(userWithdrawSetting.transactionType);
      expect(result.pixKey).toBe(userWithdrawSetting.pixKey);
      expect(result.type).toBe(WithdrawSettingType.BALANCE);
      expect(result.day).toBeUndefined();
      expect(result.weekDay).toBeUndefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockGetUserWithdrawSettingRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserWithdrawSettingRepository).toHaveBeenCalledWith(
        userWithdrawSetting.id,
      );
      expect(mockCreateUserWithdrawSettingRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatedUserWithdrawSettingEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should create daily user withdraw setting request successfully', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRepository,
        mockCreateUserWithdrawSettingRepository,
        mockCreatedUserWithdrawSettingEvent,
      } = makeSut();

      const userWithdrawSetting =
        await UserWithdrawSettingFactory.create<UserWithdrawSettingEntity>(
          UserWithdrawSettingEntity.name,
          {
            type: WithdrawSettingType.DAILY,
          },
        );

      mockGetUserWithdrawSettingRepository.mockResolvedValue(null);
      mockCreateUserWithdrawSettingRepository.mockResolvedValue(
        userWithdrawSetting,
      );

      const result = await sut.execute(
        userWithdrawSetting.id,
        userWithdrawSetting.type,
        userWithdrawSetting.balance,
        null,
        null,
        userWithdrawSetting.wallet,
        userWithdrawSetting.user,
        userWithdrawSetting.transactionType,
        userWithdrawSetting.pixKey,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(userWithdrawSetting.id);
      expect(result.wallet).toBe(userWithdrawSetting.wallet);
      expect(result.user).toBe(userWithdrawSetting.user);
      expect(result.transactionType).toBe(userWithdrawSetting.transactionType);
      expect(result.pixKey).toBe(userWithdrawSetting.pixKey);
      expect(result.type).toBe(WithdrawSettingType.DAILY);
      expect(result.day).toBeUndefined();
      expect(result.weekDay).toBeUndefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockGetUserWithdrawSettingRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserWithdrawSettingRepository).toHaveBeenCalledWith(
        userWithdrawSetting.id,
      );
      expect(mockCreateUserWithdrawSettingRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatedUserWithdrawSettingEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0007 - Should create weekly user withdraw setting request successfully', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRepository,
        mockCreateUserWithdrawSettingRepository,
        mockCreatedUserWithdrawSettingEvent,
      } = makeSut();

      const userWithdrawSetting =
        await UserWithdrawSettingFactory.create<UserWithdrawSettingEntity>(
          UserWithdrawSettingEntity.name,
          {
            type: WithdrawSettingType.WEEKLY,
            weekDay: WithdrawSettingWeekDays.MONDAY,
          },
        );

      mockGetUserWithdrawSettingRepository.mockResolvedValue(null);
      mockCreateUserWithdrawSettingRepository.mockResolvedValue(
        userWithdrawSetting,
      );

      const result = await sut.execute(
        userWithdrawSetting.id,
        userWithdrawSetting.type,
        userWithdrawSetting.balance,
        null,
        userWithdrawSetting.weekDay,
        userWithdrawSetting.wallet,
        userWithdrawSetting.user,
        userWithdrawSetting.transactionType,
        userWithdrawSetting.pixKey,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(userWithdrawSetting.id);
      expect(result.wallet).toBe(userWithdrawSetting.wallet);
      expect(result.user).toBe(userWithdrawSetting.user);
      expect(result.transactionType).toBe(userWithdrawSetting.transactionType);
      expect(result.pixKey).toBe(userWithdrawSetting.pixKey);
      expect(result.type).toBe(WithdrawSettingType.WEEKLY);
      expect(result.day).toBeUndefined();
      expect(result.weekDay).toBe(userWithdrawSetting.weekDay);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockGetUserWithdrawSettingRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserWithdrawSettingRepository).toHaveBeenCalledWith(
        userWithdrawSetting.id,
      );
      expect(mockCreateUserWithdrawSettingRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatedUserWithdrawSettingEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0008 - Should create monthly user withdraw setting request successfully', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRepository,
        mockCreateUserWithdrawSettingRepository,
        mockCreatedUserWithdrawSettingEvent,
      } = makeSut();

      const userWithdrawSetting =
        await UserWithdrawSettingFactory.create<UserWithdrawSettingEntity>(
          UserWithdrawSettingEntity.name,
          {
            type: WithdrawSettingType.MONTHLY,
            day: 10,
          },
        );

      mockGetUserWithdrawSettingRepository.mockResolvedValue(null);
      mockCreateUserWithdrawSettingRepository.mockResolvedValue(
        userWithdrawSetting,
      );

      const result = await sut.execute(
        userWithdrawSetting.id,
        userWithdrawSetting.type,
        userWithdrawSetting.balance,
        userWithdrawSetting.day,
        null,
        userWithdrawSetting.wallet,
        userWithdrawSetting.user,
        userWithdrawSetting.transactionType,
        userWithdrawSetting.pixKey,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(userWithdrawSetting.id);
      expect(result.wallet).toBe(userWithdrawSetting.wallet);
      expect(result.user).toBe(userWithdrawSetting.user);
      expect(result.transactionType).toBe(userWithdrawSetting.transactionType);
      expect(result.pixKey).toBe(userWithdrawSetting.pixKey);
      expect(result.type).toBe(WithdrawSettingType.MONTHLY);
      expect(result.day).toBe(userWithdrawSetting.day);
      expect(result.weekDay).toBeUndefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockGetUserWithdrawSettingRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserWithdrawSettingRepository).toHaveBeenCalledWith(
        userWithdrawSetting.id,
      );
      expect(mockCreateUserWithdrawSettingRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatedUserWithdrawSettingEvent).toHaveBeenCalledTimes(1);
    });
  });
});
