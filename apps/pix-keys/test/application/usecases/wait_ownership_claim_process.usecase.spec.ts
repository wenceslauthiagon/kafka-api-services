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
  WaitOwnershipClaimProcessUseCase,
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';
import { PixKeyClaimFactory, PixKeyFactory } from '@zro/test/pix-keys/config';

describe('WaitOwnershipClaimProcessUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { eventEmitter, mockOwnershipWaitPixKeyEvent } = mockEvent();
    const {
      pixKeyRepository,
      mockGetRepository,
      mockUpdatePixKeyRepository,
      pixKeyClaimRepository,
      mockUpdatePixKeyClaimRepository,
    } = mockRepository();
    const sut = new WaitOwnershipClaimProcessUseCase(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
    );
    return {
      sut,
      mockOwnershipWaitPixKeyEvent,
      mockGetRepository,
      mockUpdatePixKeyRepository,
      mockUpdatePixKeyClaimRepository,
    };
  };

  const mockEvent = () => {
    const eventEmitter: PixKeyEventEmitter = createMock<PixKeyEventEmitter>();
    const mockOwnershipWaitPixKeyEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.ownershipWaitingPixKey),
    );
    return {
      eventEmitter,
      mockOwnershipWaitPixKeyEvent,
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
    it('TC0001 - Should not wait ownership without key', async () => {
      const {
        sut,
        mockOwnershipWaitPixKeyEvent,
        mockGetRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();
      const testScript = () => sut.execute(undefined);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockOwnershipWaitPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not wait ownership when pix key not found', async () => {
      const {
        sut,
        mockOwnershipWaitPixKeyEvent,
        mockGetRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
      );
      mockGetRepository.mockResolvedValue([]);

      const testScript = () => sut.execute(pixKey.key);
      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);

      expect(mockOwnershipWaitPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not wait ownership when state is already OWNERSHIP_WAITING', async () => {
      const {
        sut,
        mockOwnershipWaitPixKeyEvent,
        mockGetRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_WAITING },
      );
      mockGetRepository.mockResolvedValue([pixKey]);

      const result = await sut.execute(pixKey.key);
      expect(mockOwnershipWaitPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(result.state).toEqual(KeyState.OWNERSHIP_WAITING);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not wait ownership when state is not OWNERSHIP_STARTED', async () => {
      const {
        sut,
        mockOwnershipWaitPixKeyEvent,
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

      expect(mockOwnershipWaitPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid called', () => {
    it('TC0005 - Should wait ownership when state is OWNERSHIP_STARTED', async () => {
      const {
        sut,
        mockOwnershipWaitPixKeyEvent,
        mockGetRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      const claim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
      );

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_STARTED, claim },
      );
      mockGetRepository.mockResolvedValue([pixKey]);

      const result = await sut.execute(pixKey.key);

      expect(result).toBeDefined();
      expect(result.state).toBe(KeyState.OWNERSHIP_WAITING);

      expect(mockOwnershipWaitPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledWith(pixKey);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(1);
    });
  });
});
