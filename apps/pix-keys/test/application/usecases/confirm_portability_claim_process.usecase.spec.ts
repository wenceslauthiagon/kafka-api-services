import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { KeyState, PixKeyEntity, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  ConfirmPortabilityClaimProcessUseCase,
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('ConfirmPortabilityClaimProcessUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { eventEmitter, mockPortabilityConfirmPixKeyEvent } = mockEvent();
    const { pixKeyRepository, mockGetRepository, mockUpdateRepository } =
      mockRepository();
    const sut = new ConfirmPortabilityClaimProcessUseCase(
      logger,
      pixKeyRepository,
      eventEmitter,
    );
    return {
      sut,
      mockPortabilityConfirmPixKeyEvent,
      mockGetRepository,
      mockUpdateRepository,
    };
  };

  const mockEvent = () => {
    const eventEmitter: PixKeyEventEmitter = createMock<PixKeyEventEmitter>();
    const mockPortabilityConfirmPixKeyEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.portabilityConfirmedPixKey),
    );
    return {
      eventEmitter,
      mockPortabilityConfirmPixKeyEvent,
    };
  };

  const mockRepository = () => {
    const pixKeyRepository: PixKeyRepository = createMock<PixKeyRepository>();
    const mockGetRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.getByKeyAndStateIsNotCanceled),
    );
    const mockUpdateRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.update),
    );

    return { pixKeyRepository, mockGetRepository, mockUpdateRepository };
  };

  describe('With invalid called', () => {
    it('TC0001 - Should not confirm portability without key', async () => {
      const {
        sut,
        mockPortabilityConfirmPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
      } = makeSut();
      const testScript = () => sut.execute(undefined);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockPortabilityConfirmPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not confirm portability when pix key not found', async () => {
      const {
        sut,
        mockPortabilityConfirmPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
      } = makeSut();
      const { key } = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
      );
      mockGetRepository.mockResolvedValue([]);

      const testScript = () => sut.execute(key);
      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);

      expect(mockPortabilityConfirmPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should not confirm portability when state is already PORTABILITY_CONFIRMED', async () => {
      const {
        sut,
        mockPortabilityConfirmPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
      } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_CONFIRMED },
      );
      mockGetRepository.mockResolvedValue([pixKey]);

      const result = await sut.execute(pixKey.key);
      expect(mockPortabilityConfirmPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(result.state).toEqual(KeyState.PORTABILITY_CONFIRMED);
    });

    it('TC0004 - Should not confirm portability when state is not PORTABILITY_STARTED', async () => {
      const {
        sut,
        mockPortabilityConfirmPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
      } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PENDING },
      );
      mockGetRepository.mockResolvedValue([pixKey]);

      const testScript = () => sut.execute(pixKey.key);
      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);

      expect(mockPortabilityConfirmPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid called', () => {
    it('TC0005 - Should confirm ownership when state is PORTABILITY_STARTED', async () => {
      const {
        sut,
        mockPortabilityConfirmPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
      } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_STARTED },
      );
      mockGetRepository.mockResolvedValue([pixKey]);

      const result = await sut.execute(pixKey.key);

      expect(result).toBeDefined();
      expect(result.state).toBe(KeyState.PORTABILITY_CONFIRMED);

      expect(mockPortabilityConfirmPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledWith(result);
    });
  });
});
