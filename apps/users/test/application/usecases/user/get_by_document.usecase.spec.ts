import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { UserRepository, UserEntity } from '@zro/users/domain';
import { GetUserByDocumentUseCase as UseCase } from '@zro/users/application';
import { UserFactory } from '@zro/test/users/config';

describe('GetUserByDocumentUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { userRepository, mockGetByDocumentRepository } = mockRepository();

    const sut = new UseCase(logger, userRepository);
    return { sut, mockGetByDocumentRepository };
  };

  const mockRepository = () => {
    const userRepository: UserRepository = createMock<UserRepository>();
    const mockGetByDocumentRepository: jest.Mock = On(userRepository).get(
      method((mock) => mock.getByDocument),
    );

    return { userRepository, mockGetByDocumentRepository };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get user successfully', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const { sut, mockGetByDocumentRepository } = makeSut();

      mockGetByDocumentRepository.mockResolvedValue(user);

      const foundUser = await sut.execute(user.document);

      expect(foundUser).toBeDefined();
      expect(foundUser.document).toBe(user.document);
    });
  });
  describe('With invalid parameters', () => {
    it('TC0002 - Should not get user if missing data', async () => {
      const { sut, mockGetByDocumentRepository } = makeSut();

      await expect(() => sut.execute(null)).rejects.toThrow(
        MissingDataException,
      );

      expect(mockGetByDocumentRepository).toHaveBeenCalledTimes(0);
    });
  });
});
