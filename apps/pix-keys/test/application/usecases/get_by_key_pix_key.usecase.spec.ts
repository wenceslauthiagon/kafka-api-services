import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { PixKeyEntity, PixKeyRepository } from '@zro/pix-keys/domain';
import { GetByKeyPixKeyUseCase } from '@zro/pix-keys/application';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('GetByKeyPixKeyUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { pixKeyRepository, mockGetRepository } = mockRepository();
    const sut = new GetByKeyPixKeyUseCase(logger, pixKeyRepository);
    return {
      sut,
      pixKeyRepository,
      mockGetRepository,
    };
  };

  const mockRepository = () => {
    const pixKeyRepository: PixKeyRepository = createMock<PixKeyRepository>();
    const mockGetRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.getByKeyAndStateIsNotCanceled),
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

      const result = await sut.execute(pixKey.key);

      expect(result).toBeDefined();
      expect(
        pixKeyRepository.getByKeyAndStateIsNotCanceled,
      ).toHaveBeenCalledWith(pixKey.key);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get pix key', async () => {
      const { sut, mockGetRepository } = makeSut();
      mockGetRepository.mockReturnValue([]);

      const result = await sut.execute('x');

      expect(result).toBeUndefined();
      expect(mockGetRepository).toHaveBeenCalledWith('x');
    });

    it('TC0003 - Should not get pix key with invalid params', async () => {
      const { sut, mockGetRepository } = makeSut();
      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetRepository).toHaveBeenCalledTimes(0);
    });
  });
});
