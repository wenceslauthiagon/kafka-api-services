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
  CompleteOwnershipClaimProcessUseCase,
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';
import { PixKeyClaimFactory, PixKeyFactory } from '@zro/test/pix-keys/config';

describe('CompleteOwnershipClaimProcessUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const { eventEmitter, mockOwnershipReadyPixKeyEvent } = mockEvent();
    const {
      pixKeyRepository,
      mockGetRepository,
      mockUpdatePixKeyRepository,
      pixKeyClaimRepository,
      mockUpdatePixKeyClaimRepository,
    } = mockRepository();

    const sut = new CompleteOwnershipClaimProcessUseCase(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
    );

    return {
      sut,
      mockOwnershipReadyPixKeyEvent,
      mockGetRepository,
      mockUpdatePixKeyRepository,
      mockUpdatePixKeyClaimRepository,
    };
  };

  const mockEvent = () => {
    const eventEmitter: PixKeyEventEmitter = createMock<PixKeyEventEmitter>();
    const mockOwnershipReadyPixKeyEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.ownershipReadyPixKey),
    );
    return {
      eventEmitter,
      mockOwnershipReadyPixKeyEvent,
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
    it('TC0001 - Should not ready ownership without key', async () => {
      const {
        sut,
        mockOwnershipReadyPixKeyEvent,
        mockGetRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      const testScript = () => sut.execute(undefined);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockOwnershipReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not ready ownership when pix key not found', async () => {
      const {
        sut,
        mockOwnershipReadyPixKeyEvent,
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
      expect(mockOwnershipReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not ready ownership when state is already OWNERSHIP_READY', async () => {
      const {
        sut,
        mockOwnershipReadyPixKeyEvent,
        mockGetRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();
      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_READY },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const pixKey = await sut.execute(pixKeyData.key);

      expect(pixKey.state).toEqual(KeyState.OWNERSHIP_READY);
      expect(mockOwnershipReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not ready ownership when state is not OWNERSHIP_CONFIRMED', async () => {
      const {
        sut,
        mockOwnershipReadyPixKeyEvent,
        mockGetRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();
      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PENDING },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const testScript = () => sut.execute(pixKeyData.key);
      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);

      expect(mockOwnershipReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid called', () => {
    it('TC0005 - Should ready ownership when state is OWNERSHIP_CONFIRMED', async () => {
      const {
        sut,
        mockOwnershipReadyPixKeyEvent,
        mockGetRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      const claim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
      );

      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_CONFIRMED, claim },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const pixKey = await sut.execute(pixKeyData.key);

      expect(pixKey).toBeDefined();
      expect(pixKey.state).toBe(KeyState.OWNERSHIP_READY);

      expect(mockOwnershipReadyPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledWith(pixKey);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(1);
    });
  });
});
