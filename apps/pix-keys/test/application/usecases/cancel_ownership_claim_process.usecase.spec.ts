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
  CancelOwnershipClaimProcessUseCase,
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';
import { PixKeyClaimFactory, PixKeyFactory } from '@zro/test/pix-keys/config';

describe('CancelOwnershipClaimProcessUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { eventEmitter, mockOwnershipCanceledPixKeyEvent } = mockEvent();
    const {
      pixKeyRepository,
      mockGetRepository,
      mockUpdateRepository,
      pixKeyClaimRepository,
      mockUpdatePixKeyClaimRepository,
    } = mockRepository();
    const sut = new CancelOwnershipClaimProcessUseCase(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
    );
    return {
      sut,
      mockOwnershipCanceledPixKeyEvent,
      mockGetRepository,
      mockUpdateRepository,
      mockUpdatePixKeyClaimRepository,
    };
  };

  const mockEvent = () => {
    const eventEmitter: PixKeyEventEmitter = createMock<PixKeyEventEmitter>();
    const mockOwnershipCanceledPixKeyEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.ownershipCanceledPixKey),
    );
    return {
      eventEmitter,
      mockOwnershipCanceledPixKeyEvent,
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
    it('TC0001 - Should not cancel ownership without key', async () => {
      const {
        sut,
        mockOwnershipCanceledPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();
      const testScript = () => sut.execute(undefined);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockOwnershipCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not cancel ownership when pix key not found', async () => {
      const {
        sut,
        mockOwnershipCanceledPixKeyEvent,
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

      expect(mockOwnershipCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not cancel ownership when state is already OWNERSHIP_CANCELED', async () => {
      const {
        sut,
        mockOwnershipCanceledPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_CANCELED },
      );
      mockGetRepository.mockResolvedValue([pixKey]);

      const result = await sut.execute(pixKey.key);
      expect(mockOwnershipCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(result.state).toEqual(KeyState.OWNERSHIP_CANCELED);
    });

    it('TC0004 - Should not cancel ownership when state is not OWNERSHIP_STARTED | OWNERSHIP_WAITING | OWNERSHIP_CONFIRMED', async () => {
      const {
        sut,
        mockOwnershipCanceledPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PENDING },
      );
      mockGetRepository.mockResolvedValue([pixKey]);

      const testScript = () => sut.execute(pixKey.key);
      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);

      expect(mockOwnershipCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid called', () => {
    it('TC0005 - Should cancel ownership when state is OWNERSHIP_STARTED', async () => {
      const {
        sut,
        mockOwnershipCanceledPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
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
      expect(result.state).toBe(KeyState.OWNERSHIP_CANCELED);

      expect(mockOwnershipCanceledPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledWith(result);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should cancel ownership when state is OWNERSHIP_WAITING', async () => {
      const {
        sut,
        mockOwnershipCanceledPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      const claim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
      );

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_WAITING, claim },
      );
      mockGetRepository.mockResolvedValue([pixKey]);

      const result = await sut.execute(pixKey.key);

      expect(result).toBeDefined();
      expect(result.state).toBe(KeyState.OWNERSHIP_CANCELED);

      expect(mockOwnershipCanceledPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledWith(result);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0007 - Should cancel ownership when state is OWNERSHIP_CONFIRMED', async () => {
      const {
        sut,
        mockOwnershipCanceledPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      const claim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
      );

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_CONFIRMED, claim },
      );
      mockGetRepository.mockResolvedValue([pixKey]);

      const result = await sut.execute(pixKey.key);

      expect(result).toBeDefined();
      expect(result.state).toBe(KeyState.OWNERSHIP_CANCELED);

      expect(mockOwnershipCanceledPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.key);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledWith(result);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(1);
    });
  });
});
