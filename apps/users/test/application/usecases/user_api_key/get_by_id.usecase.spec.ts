import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { UserApiKeyEntity, UserApiKeyRepository } from '@zro/users/domain';
import { GetUserApiKeyByIdUseCase as UseCase } from '@zro/users/application';
import { UserApiKeyFactory } from '@zro/test/users/config';

describe('GetUserApiKeyByIdUseCase', () => {
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
      method((mock) => mock.getById),
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
      const id = uuidV4();

      const userApiKey = await UserApiKeyFactory.create<UserApiKeyEntity>(
        UserApiKeyEntity.name,
      );
      mockGetUserApiKeyRepository.mockResolvedValue(userApiKey);

      const result = await sut.execute(id);

      expect(result).toBeDefined();
      expect(mockGetUserApiKeyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserApiKeyRepository).toHaveBeenCalledWith(id);
    });
  });
});
