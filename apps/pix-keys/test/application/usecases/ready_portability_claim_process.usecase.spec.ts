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
  ReadyPortabilityClaimProcessUseCase,
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';
import { PixKeyClaimFactory, PixKeyFactory } from '@zro/test/pix-keys/config';

describe('ReadyPortabilityClaimProcessUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = (autoApprovePortabilityRequest = false) => {
    const {
      eventEmitter,
      mockPortabilityRequestPendingPixKeyEvent,
      mockPortabilityRequestAutoConfirmedPixKeyEvent,
    } = mockEvent();
    const {
      pixKeyRepository,
      mockGetRepository,
      mockUpdateRepository,
      pixKeyClaimRepository,
      mockUpdatePixKeyClaimRepository,
    } = mockRepository();
    const sut = new ReadyPortabilityClaimProcessUseCase(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
      autoApprovePortabilityRequest,
    );
    return {
      sut,
      mockPortabilityRequestPendingPixKeyEvent,
      mockGetRepository,
      mockUpdateRepository,
      mockPortabilityRequestAutoConfirmedPixKeyEvent,
      mockUpdatePixKeyClaimRepository,
    };
  };

  const mockEvent = () => {
    const eventEmitter: PixKeyEventEmitter = createMock<PixKeyEventEmitter>();
    const mockPortabilityRequestPendingPixKeyEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.portabilityRequestPendingPixKey));
    const mockPortabilityRequestAutoConfirmedPixKeyEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.portabilityRequestAutoConfirmedPixKey));
    return {
      eventEmitter,
      mockPortabilityRequestPendingPixKeyEvent,
      mockPortabilityRequestAutoConfirmedPixKeyEvent,
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

    const pixKeyClaimRepository: PixKeyClaimRepository =
      createMock<PixKeyClaimRepository>();
    const mockUpdatePixKeyClaimRepository: jest.Mock = On(
      pixKeyClaimRepository,
    ).get(method((mock) => mock.update));

    return {
      pixKeyRepository,
      mockGetRepository,
      mockUpdateRepository,
      pixKeyClaimRepository,
      mockUpdatePixKeyClaimRepository,
    };
  };

  describe('With invalid called', () => {
    it('TC0001 - Should not ready portability without key', async () => {
      const {
        sut,
        mockPortabilityRequestPendingPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();
      const testScript = () => sut.execute(undefined);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockPortabilityRequestPendingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not ready portability when pix key not found', async () => {
      const {
        sut,
        mockPortabilityRequestPendingPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();
      const { key } = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
      );
      mockGetRepository.mockResolvedValue([]);

      const testScript = () => sut.execute(key);
      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);

      expect(mockPortabilityRequestPendingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not ready portability when state is already PORTABILITY_REQUEST_PENDING', async () => {
      const {
        sut,
        mockPortabilityRequestPendingPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();
      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_REQUEST_PENDING },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const pixKey = await sut.execute(pixKeyData.key);
      expect(mockPortabilityRequestPendingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(pixKey.state).toEqual(KeyState.PORTABILITY_REQUEST_PENDING);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not ready portability when state is not READY | ADD_KEY_READY | PORTABILITY_READY', async () => {
      const {
        sut,
        mockPortabilityRequestPendingPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();
      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
      );

      const invalidStates = Object.values(KeyState).filter(
        (state) =>
          ![
            KeyState.READY,
            KeyState.ADD_KEY_READY,
            KeyState.PORTABILITY_READY,
            KeyState.OWNERSHIP_READY,
            KeyState.PORTABILITY_REQUEST_PENDING,
            KeyState.PORTABILITY_REQUEST_AUTO_CONFIRMED,
          ].includes(state),
      );

      for (const state of invalidStates) {
        pixKeyData.state = state;
        mockGetRepository.mockResolvedValueOnce([pixKeyData]);

        const testScript = () => sut.execute(pixKeyData.key);
        await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      }

      expect(mockPortabilityRequestPendingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(invalidStates.length);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should not ready portability when state is already PORTABILITY_REQUEST_AUTO_CONFIRMED', async () => {
      const {
        sut,
        mockPortabilityRequestPendingPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();
      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_REQUEST_AUTO_CONFIRMED },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const pixKey = await sut.execute(pixKeyData.key);
      expect(mockPortabilityRequestPendingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(pixKey.state).toEqual(KeyState.PORTABILITY_REQUEST_AUTO_CONFIRMED);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid called', () => {
    it('TC0005 - Should ready portability when state is READY', async () => {
      const {
        sut,
        mockPortabilityRequestPendingPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      const claim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
      );

      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.READY, claim },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const pixKey = await sut.execute(pixKeyData.key);

      expect(pixKey).toBeDefined();
      expect(pixKey.state).toBe(KeyState.PORTABILITY_REQUEST_PENDING);

      expect(mockPortabilityRequestPendingPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledWith(pixKey);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should ready portability when state is ADD_KEY_READY', async () => {
      const {
        sut,
        mockPortabilityRequestPendingPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      const claim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
      );

      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.ADD_KEY_READY, claim },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const pixKey = await sut.execute(pixKeyData.key);

      expect(pixKey).toBeDefined();
      expect(pixKey.state).toBe(KeyState.PORTABILITY_REQUEST_PENDING);

      expect(mockPortabilityRequestPendingPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledWith(pixKey);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0007 - Should ready portability when state is PORTABILITY_READY', async () => {
      const {
        sut,
        mockPortabilityRequestPendingPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      const claim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
      );

      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_READY, claim },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const pixKey = await sut.execute(pixKeyData.key);

      expect(pixKey).toBeDefined();
      expect(pixKey.state).toBe(KeyState.PORTABILITY_REQUEST_PENDING);

      expect(mockPortabilityRequestPendingPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledWith(pixKey);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0009 - Should automatically ready portability when state is READY', async () => {
      const {
        sut,
        mockPortabilityRequestAutoConfirmedPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut(true);

      const claim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
      );

      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.READY, claim },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const pixKey = await sut.execute(pixKeyData.key);

      expect(pixKey).toBeDefined();
      expect(pixKey.state).toBe(KeyState.PORTABILITY_REQUEST_AUTO_CONFIRMED);

      expect(
        mockPortabilityRequestAutoConfirmedPixKeyEvent,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledWith(pixKey);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(1);
    });
  });
});
