import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { UserEntity, UserRepository } from '@zro/users/domain';
import {
  UpdateUserPinHasCreatedUseCase as UseCase,
  UserEventEmitter,
  UserNotFoundException,
  UserPinHasCreatedIsAlreadyFalseException,
} from '@zro/users/application';
import { UserFactory } from '@zro/test/users/config';

describe('UpdateUserPinHasCreatedUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const eventEmitter: UserEventEmitter = createMock<UserEventEmitter>();
    const mockUpdatePinUserEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.updatePinUser),
    );

    const userRepository: UserRepository = createMock<UserRepository>();
    const mockUpdateUser: jest.Mock = On(userRepository).get(
      method((mock) => mock.update),
    );
    const mockGetUserByUuid: jest.Mock = On(userRepository).get(
      method((mock) => mock.getByUuid),
    );

    const sut = new UseCase(logger, userRepository, eventEmitter);

    return { sut, mockUpdatePinUserEvent, mockUpdateUser, mockGetUserByUuid };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should update user pin has created successfully', async () => {
      const { sut, mockUpdatePinUserEvent, mockUpdateUser, mockGetUserByUuid } =
        makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        pinHasCreated: true,
      });

      mockGetUserByUuid.mockResolvedValue(user);

      await sut.execute(user.uuid);

      expect(user.pinHasCreated).toBe(false);
      expect(mockUpdateUser).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockUpdatePinUserEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw MissingDataException when missing params', async () => {
      const { sut, mockUpdatePinUserEvent, mockUpdateUser, mockGetUserByUuid } =
        makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockUpdateUser).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(0);
      expect(mockUpdatePinUserEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not update pin has created when user is not found', async () => {
      const { sut, mockUpdatePinUserEvent, mockUpdateUser, mockGetUserByUuid } =
        makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        pinHasCreated: true,
      });

      mockGetUserByUuid.mockResolvedValue(null);

      const testScript = () => sut.execute(user.uuid);

      await expect(testScript).rejects.toThrow(UserNotFoundException);
      expect(mockUpdateUser).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockUpdatePinUserEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw UserPinHasCreatedIsAlreadyFalseException when pin has created is already false', async () => {
      const { sut, mockUpdatePinUserEvent, mockUpdateUser, mockGetUserByUuid } =
        makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        pinHasCreated: false,
      });

      mockGetUserByUuid.mockResolvedValue(user);

      const testScript = () => sut.execute(user.uuid);

      await expect(testScript).rejects.toThrow(
        UserPinHasCreatedIsAlreadyFalseException,
      );
      expect(mockUpdateUser).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockUpdatePinUserEvent).toHaveBeenCalledTimes(0);
    });
  });
});
