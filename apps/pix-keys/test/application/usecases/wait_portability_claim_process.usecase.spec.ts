import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  KeyState,
  PixKeyClaimEntity,
  PixKeyClaimRepository,
  PixKeyEntity,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  WaitPortabilityClaimProcessUseCase,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';
import { PixKeyClaimFactory, PixKeyFactory } from '@zro/test/pix-keys/config';

describe('WaitPortabilityClaimProcessUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      pixKeyRepository,
      mockGetRepository,
      pixKeyClaimRepository,
      mockUpdatePixKeyClaimRepository,
    } = mockRepository();
    const sut = new WaitPortabilityClaimProcessUseCase(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
    );
    return {
      sut,
      mockGetRepository,
      mockUpdatePixKeyClaimRepository,
    };
  };

  const mockRepository = () => {
    const pixKeyRepository: PixKeyRepository = createMock<PixKeyRepository>();
    const mockGetRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.getByKeyAndStateIsNotCanceled),
    );

    const pixKeyClaimRepository: PixKeyClaimRepository =
      createMock<PixKeyClaimRepository>();
    const mockUpdatePixKeyClaimRepository: jest.Mock = On(
      pixKeyClaimRepository,
    ).get(method((mock) => mock.update));

    return {
      pixKeyRepository,
      mockGetRepository,
      pixKeyClaimRepository,
      mockUpdatePixKeyClaimRepository,
    };
  };

  describe('With invalid called', () => {
    it('TC0001 - Should not wait portability without key', async () => {
      const { sut, mockGetRepository, mockUpdatePixKeyClaimRepository } =
        makeSut();
      const testScript = () => sut.execute(undefined);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockGetRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not wait portabiliy when pix key not found', async () => {
      const { sut, mockGetRepository, mockUpdatePixKeyClaimRepository } =
        makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
      );
      mockGetRepository.mockResolvedValue([]);

      const testScript = () => sut.execute(pixKey.key);
      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);

      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw PixKeyInvalidStateException when state is not PORTABILITY_STARTED', async () => {
      const { sut, mockGetRepository, mockUpdatePixKeyClaimRepository } =
        makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        {
          state: KeyState.PORTABILITY_CANCELED,
        },
      );
      mockGetRepository.mockResolvedValue([pixKey]);

      const testScript = () => sut.execute(pixKey.key);
      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);

      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid called', () => {
    it('TC0003 - Should wait portability', async () => {
      const { sut, mockGetRepository, mockUpdatePixKeyClaimRepository } =
        makeSut();

      const claim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
      );

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_STARTED, claim },
      );
      mockGetRepository.mockResolvedValue([pixKey]);

      const result = await sut.execute(pixKey.key);

      expect(result).toBeDefined();

      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(1);
    });
  });
});
