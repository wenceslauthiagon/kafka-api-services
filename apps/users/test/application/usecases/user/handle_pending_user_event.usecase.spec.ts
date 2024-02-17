import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  UserEntity,
  UserOnboardingRepository,
  UserPinAttemptsRepository,
  UserRepository,
  UserSettingRepository,
} from '@zro/users/domain';
import {
  HandlePendingUserEventUseCase as UseCase,
  UserNotFoundException,
} from '@zro/users/application';
import { UserFactory } from '@zro/test/users/config';

describe('HandlePendingUserEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      userRepository,
      userPinAttemptsRepository,
      userOnboardingRepository,
      userSettingRepository,
      mockGetByUuidRepository,
      mockCreateUserPinAttemptsRepository,
      mockCreateUserOnboardingRepository,
      mockCreateUserSettingRepository,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      userRepository,
      userPinAttemptsRepository,
      userOnboardingRepository,
      userSettingRepository,
    );

    return {
      sut,
      mockGetByUuidRepository,
      mockCreateUserPinAttemptsRepository,
      mockCreateUserOnboardingRepository,
      mockCreateUserSettingRepository,
    };
  };

  const mockRepository = () => {
    const userRepository: UserRepository = createMock<UserRepository>();
    const userPinAttemptsRepository: UserPinAttemptsRepository =
      createMock<UserPinAttemptsRepository>();
    const userOnboardingRepository: UserOnboardingRepository =
      createMock<UserOnboardingRepository>();
    const userSettingRepository: UserSettingRepository =
      createMock<UserSettingRepository>();
    const mockGetByUuidRepository: jest.Mock = On(userRepository).get(
      method((mock) => mock.getByUuid),
    );
    const mockCreateUserPinAttemptsRepository: jest.Mock = On(
      userPinAttemptsRepository,
    ).get(method((mock) => mock.create));
    const mockCreateUserOnboardingRepository: jest.Mock = On(
      userOnboardingRepository,
    ).get(method((mock) => mock.create));
    const mockCreateUserSettingRepository: jest.Mock = On(
      userSettingRepository,
    ).get(method((mock) => mock.create));

    return {
      userRepository,
      userPinAttemptsRepository,
      userOnboardingRepository,
      userSettingRepository,
      mockGetByUuidRepository,
      mockCreateUserPinAttemptsRepository,
      mockCreateUserOnboardingRepository,
      mockCreateUserSettingRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle pending user event if missing params', async () => {
      const {
        sut,
        mockGetByUuidRepository,
        mockCreateUserPinAttemptsRepository,
        mockCreateUserOnboardingRepository,
        mockCreateUserSettingRepository,
      } = makeSut();

      const test = () => sut.execute(null);

      await expect(test).rejects.toThrow(MissingDataException);

      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateUserPinAttemptsRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateUserOnboardingRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateUserSettingRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not handle pending user event if missing user', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const {
        sut,
        mockGetByUuidRepository,
        mockCreateUserPinAttemptsRepository,
        mockCreateUserOnboardingRepository,
        mockCreateUserSettingRepository,
      } = makeSut();

      mockGetByUuidRepository.mockResolvedValue(null);
      const test = () => sut.execute(user.uuid);

      await expect(test).rejects.toThrow(UserNotFoundException);

      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateUserPinAttemptsRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateUserOnboardingRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateUserSettingRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should handle pending user event with valid params', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const {
        sut,
        mockGetByUuidRepository,
        mockCreateUserPinAttemptsRepository,
        mockCreateUserOnboardingRepository,
        mockCreateUserSettingRepository,
      } = makeSut();

      mockGetByUuidRepository.mockResolvedValue(user);
      await sut.execute(user.uuid);

      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateUserPinAttemptsRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateUserOnboardingRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateUserSettingRepository).toHaveBeenCalledTimes(1);
    });
  });
});
