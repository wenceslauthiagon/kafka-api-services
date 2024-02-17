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
  CancelPortabilityClaimProcessUseCase,
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';
import { PixKeyClaimFactory, PixKeyFactory } from '@zro/test/pix-keys/config';

describe('CancelPortabilityClaimProcessUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { eventEmitter, mockPortabilityCanceledPixKeyEvent } = mockEvent();
    const {
      pixKeyRepository,
      mockGetRepository,
      mockUpdatePixKeyRepository,
      pixKeyClaimRepository,
      mockUpdatePixKeyClaimRepository,
    } = mockRepository();
    const sut = new CancelPortabilityClaimProcessUseCase(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
    );
    return {
      sut,
      mockPortabilityCanceledPixKeyEvent,
      mockGetRepository,
      mockUpdatePixKeyRepository,
      mockUpdatePixKeyClaimRepository,
    };
  };

  const mockEvent = () => {
    const eventEmitter: PixKeyEventEmitter = createMock<PixKeyEventEmitter>();
    const mockPortabilityCanceledPixKeyEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.portabilityCanceledPixKey),
    );
    return {
      eventEmitter,
      mockPortabilityCanceledPixKeyEvent,
    };
  };

  const mockRepository = () => {
    const pixKeyRepository: PixKeyRepository = createMock<PixKeyRepository>();
    const mockGetRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.getByKeyAndStateIsNotCanceled),
    );
    const mockUpdatePixKeyRepository: jest.Mock = On(pixKeyRepository).get(
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
      mockUpdatePixKeyRepository,
      pixKeyClaimRepository,
      mockUpdatePixKeyClaimRepository,
    };
  };

  describe('With invalid called', () => {
    it('TC0001 - Should not cancel portability without key', async () => {
      const {
        sut,
        mockPortabilityCanceledPixKeyEvent,
        mockGetRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();
      const testScript = () => sut.execute(undefined);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockPortabilityCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not cancel portability when pix key not found', async () => {
      const {
        sut,
        mockPortabilityCanceledPixKeyEvent,
        mockGetRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();
      const { key } = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
      );
      mockGetRepository.mockResolvedValue([]);

      const testScript = () => sut.execute(key);
      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);

      expect(mockPortabilityCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not cancel portability when state is already PORTABILITY_CANCELED', async () => {
      const {
        sut,
        mockPortabilityCanceledPixKeyEvent,
        mockGetRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_CANCELED },
      );
      mockGetRepository.mockResolvedValue([pixKey]);

      const result = await sut.execute(pixKey.key);
      expect(mockPortabilityCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(result.state).toEqual(KeyState.PORTABILITY_CANCELED);
    });

    it('TC0004 - Should not cancel portability when state is not PORTABILITY_STARTED | PORTABILITY_CONFIRMED', async () => {
      const {
        sut,
        mockPortabilityCanceledPixKeyEvent,
        mockGetRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PENDING },
      );
      mockGetRepository.mockResolvedValue([pixKey]);

      const testScript = () => sut.execute(pixKey.key);
      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);

      expect(mockPortabilityCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid called', () => {
    it('TC0005 - Should cancel portability when state is PORTABILITY_STARTED', async () => {
      const {
        sut,
        mockPortabilityCanceledPixKeyEvent,
        mockGetRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

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
      expect(result.state).toBe(KeyState.PORTABILITY_CANCELED);

      expect(mockPortabilityCanceledPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledWith(result);
    });

    it('TC0006 - Should cancel portability when state is PORTABILITY_CONFIRMED', async () => {
      const {
        sut,
        mockPortabilityCanceledPixKeyEvent,
        mockGetRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      const claim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
      );

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_CONFIRMED, claim },
      );
      mockGetRepository.mockResolvedValue([pixKey]);

      const result = await sut.execute(pixKey.key);

      expect(result).toBeDefined();
      expect(result.state).toBe(KeyState.PORTABILITY_CANCELED);

      expect(mockPortabilityCanceledPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(1);

      expect(mockUpdatePixKeyRepository).toHaveBeenCalledWith(result);
    });
  });
});
