import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { UserRepository, UserEntity } from '@zro/users/domain';
import { GetUserByEmailUseCase as UseCase } from '@zro/users/application';
import { UserFactory } from '@zro/test/users/config';

describe('GetUserByEmailUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { userRepository, mockGetByEmailRepository } = mockRepository();

    const sut = new UseCase(logger, userRepository);
    return { sut, mockGetByEmailRepository };
  };

  const mockRepository = () => {
    const userRepository: UserRepository = createMock<UserRepository>();
    const mockGetByEmailRepository: jest.Mock = On(userRepository).get(
      method((mock) => mock.getByEmail),
    );

    return { userRepository, mockGetByEmailRepository };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get user successfully', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const { sut, mockGetByEmailRepository } = makeSut();

      mockGetByEmailRepository.mockResolvedValue(user);

      const foundUser = await sut.execute(user.email);

      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(user.email);
    });
  });
  describe('With invalid parameters', () => {
    it('TC0002 - Should not get user if missing data', async () => {
      const { sut, mockGetByEmailRepository } = makeSut();

      await expect(() => sut.execute(null)).rejects.toThrow(
        MissingDataException,
      );

      expect(mockGetByEmailRepository).toHaveBeenCalledTimes(0);
    });
  });
});
