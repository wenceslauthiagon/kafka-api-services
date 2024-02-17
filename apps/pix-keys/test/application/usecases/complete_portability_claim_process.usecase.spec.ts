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
  CompletePortabilityClaimProcessUseCase,
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';
import { PixKeyClaimFactory, PixKeyFactory } from '@zro/test/pix-keys/config';

describe('CompletePortabilityClaimProcessUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { eventEmitter, mockPortabilityReadyPixKeyEvent } = mockEvent();
    const {
      pixKeyRepository,
      mockGetRepository,
      mockUpdatePixRepository,
      pixKeyClaimRepository,
      mockUpdatePixKeyClaimRepository,
    } = mockRepository();
    const sut = new CompletePortabilityClaimProcessUseCase(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
    );
    return {
      sut,
      mockPortabilityReadyPixKeyEvent,
      mockGetRepository,
      mockUpdatePixRepository,
      mockUpdatePixKeyClaimRepository,
    };
  };

  const mockEvent = () => {
    const eventEmitter: PixKeyEventEmitter = createMock<PixKeyEventEmitter>();
    const mockPortabilityReadyPixKeyEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.portabilityReadyPixKey),
    );
    return {
      eventEmitter,
      mockPortabilityReadyPixKeyEvent,
    };
  };

  const mockRepository = () => {
    const pixKeyRepository: PixKeyRepository = createMock<PixKeyRepository>();
    const mockGetRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.getByKeyAndStateIsNotCanceled),
    );
    const mockUpdatePixRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.update),
    );

    const pixKeyClaimRepository: PixKeyClaimRepository =
      createMock<PixKeyClaimRepository>();
    const mockUpdatePixKeyClaimRepository: jest.Mock = On(
      pixKeyClaimRepository,
    ).get(method((mock) => mock.update));

    return {
      pixKeyRepository,
      mockGetRepository,
      mockUpdatePixRepository,
      pixKeyClaimRepository,
      mockUpdatePixKeyClaimRepository,
    };
  };

  describe('With invalid called', () => {
    it('TC0001 - Should not ready portability without key', async () => {
      const {
        sut,
        mockPortabilityReadyPixKeyEvent,
        mockGetRepository,
        mockUpdatePixRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();
      const testScript = () => sut.execute(undefined);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockPortabilityReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not ready portability when pix key not found', async () => {
      const {
        sut,
        mockPortabilityReadyPixKeyEvent,
        mockGetRepository,
        mockUpdatePixRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();
      const { key } = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
      );
      mockGetRepository.mockResolvedValue([]);

      const testScript = () => sut.execute(key);
      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);

      expect(mockPortabilityReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not ready portability when state is already PORTABILITY_READY', async () => {
      const {
        sut,
        mockPortabilityReadyPixKeyEvent,
        mockGetRepository,
        mockUpdatePixRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();
      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_READY },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const pixKey = await sut.execute(pixKeyData.key);
      expect(mockPortabilityReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(pixKey.state).toEqual(KeyState.PORTABILITY_READY);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not ready portability when state is not PORTABILITY_CONFIRMED', async () => {
      const {
        sut,
        mockPortabilityReadyPixKeyEvent,
        mockGetRepository,
        mockUpdatePixRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();
      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PENDING },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const testScript = () => sut.execute(pixKeyData.key);
      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);

      expect(mockPortabilityReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid called', () => {
    it('TC0005 - Should ready portability when state is PORTABILITY_CONFIRMED', async () => {
      const {
        sut,
        mockPortabilityReadyPixKeyEvent,
        mockGetRepository,
        mockUpdatePixRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      const claim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
      );

      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_CONFIRMED, claim },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const pixKey = await sut.execute(pixKeyData.key);

      expect(pixKey).toBeDefined();
      expect(pixKey.state).toBe(KeyState.PORTABILITY_READY);

      expect(mockPortabilityReadyPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockUpdatePixRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixRepository).toHaveBeenCalledWith(pixKey);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(1);
    });
  });
});
