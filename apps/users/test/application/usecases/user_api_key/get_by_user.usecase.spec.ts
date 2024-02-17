import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { UserApiKeyEntity, UserApiKeyRepository } from '@zro/users/domain';
import { GetUserApiKeyByUserUseCase as UseCase } from '@zro/users/application';
import { UserApiKeyFactory } from '@zro/test/users/config';

describe('GetUserApiKeyByUserUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { userApiKeyRepository, mockGetUserApiKeyRepository } =
      mockRepository();

    const sut = new UseCase(logger, userApiKeyRepository);
    return {
      sut,
      userApiKeyRepository,
      mockGetUserApiKeyRepository,
    };
  };

  const mockRepository = () => {
    const userApiKeyRepository: UserApiKeyRepository =
      createMock<UserApiKeyRepository>();
    const mockGetUserApiKeyRepository: jest.Mock = On(userApiKeyRepository).get(
      method((mock) => mock.getByUser),
    );

    return {
      userApiKeyRepository,
      mockGetUserApiKeyRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get if missing params', async () => {
      const { sut, mockGetUserApiKeyRepository } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetUserApiKeyRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get user api key successfully', async () => {
      const { sut, mockGetUserApiKeyRepository } = makeSut();

      const userApiKey = await UserApiKeyFactory.create<UserApiKeyEntity>(
        UserApiKeyEntity.name,
      );

      const { user } = userApiKey;

      mockGetUserApiKeyRepository.mockResolvedValue(userApiKey);

      const result = await sut.execute(user);

      expect(result).toBeDefined();
      expect(mockGetUserApiKeyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserApiKeyRepository).toHaveBeenCalledWith(user);
    });
  });
});
