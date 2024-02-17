import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { PixKeyEntity, PixKeyRepository } from '@zro/pix-keys/domain';
import { GetPixKeyByKeyAndUserUseCase } from '@zro/pix-keys/application';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('GetPixKeyByKeyAndUserUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { pixKeyRepository, mockGetRepository } = mockRepository();
    const sut = new GetPixKeyByKeyAndUserUseCase(logger, pixKeyRepository);
    return {
      sut,
      pixKeyRepository,
      mockGetRepository,
    };
  };

  const mockRepository = () => {
    const pixKeyRepository: PixKeyRepository = createMock<PixKeyRepository>();
    const mockGetRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.getByUserAndKeyAndStateIsNotCanceled),
    );
    return { pixKeyRepository, mockGetRepository };
  };

  describe('With valid flow', () => {
    it('TC0001 - Should get pix key successfully', async () => {
      const { sut, mockGetRepository, pixKeyRepository } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
      );
      mockGetRepository.mockReturnValue([pixKey]);

      const result = await sut.execute(pixKey.key, pixKey.user);

      expect(result).toBeDefined();
      expect(
        pixKeyRepository.getByUserAndKeyAndStateIsNotCanceled,
      ).toHaveBeenCalledWith(pixKey.user, pixKey.key);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get pix key', async () => {
      const { sut, mockGetRepository } = makeSut();
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
      );
      mockGetRepository.mockReturnValue(undefined);

      const result = await sut.execute(pixKey.key, pixKey.user);

      expect(result).toBeUndefined();
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.user, pixKey.key);
    });

    it('TC0003 - Should not get pix key with invalid params', async () => {
      const { sut, mockGetRepository } = makeSut();
      const testScript = () => sut.execute(null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetRepository).toHaveBeenCalledTimes(0);
    });
  });
});
