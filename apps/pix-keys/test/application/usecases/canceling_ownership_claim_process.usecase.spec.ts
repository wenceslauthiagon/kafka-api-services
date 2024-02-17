import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  ClaimReasonType,
  KeyState,
  PixKeyEntity,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  CancelingOwnershipClaimProcessUseCase as UseCase,
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('CancelingOwnershipClaimProcessUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  const reason = ClaimReasonType.USER_REQUESTED;

  const makeSut = () => {
    const { eventEmitter, mockOwnershipCancelingPixKeyEvent } = mockEvent();
    const { pixKeyRepository, mockGetRepository, mockUpdateRepository } =
      mockRepository();
    const sut = new UseCase(logger, pixKeyRepository, eventEmitter);

    return {
      sut,
      mockOwnershipCancelingPixKeyEvent,
      mockGetRepository,
      mockUpdateRepository,
    };
  };

  const mockEvent = () => {
    const eventEmitter: PixKeyEventEmitter = createMock<PixKeyEventEmitter>();
    const mockOwnershipCancelingPixKeyEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.ownershipCancelingPixKey),
    );
    return {
      eventEmitter,
      mockOwnershipCancelingPixKeyEvent,
    };
  };

  const mockRepository = () => {
    const pixKeyRepository: PixKeyRepository = createMock<PixKeyRepository>();
    const mockGetRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.getByUserAndIdAndStateIsNotCanceled),
    );
    const mockUpdateRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.update),
    );

    return { pixKeyRepository, mockGetRepository, mockUpdateRepository };
  };

  describe('With invalid called', () => {
    it('TC0001 - Should not canceling ownership without id and reason', async () => {
      const {
        sut,
        mockOwnershipCancelingPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
      } = makeSut();
      const testScript = () => sut.execute(null, null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockOwnershipCancelingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not canceling ownership when pix key not found', async () => {
      const {
        sut,
        mockOwnershipCancelingPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
      } = makeSut();
      const { id, user } = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
      );
      mockGetRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(user, id, reason);
      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);

      expect(mockOwnershipCancelingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(user, id);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should not canceling ownership when state is already OWNERSHIP_CANCELING', async () => {
      const {
        sut,
        mockOwnershipCancelingPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
      } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_CANCELING },
      );
      mockGetRepository.mockResolvedValue(pixKey);

      const result = await sut.execute(pixKey.user, pixKey.id, reason);

      expect(mockOwnershipCancelingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.user, pixKey.id);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(result.state).toEqual(KeyState.OWNERSHIP_CANCELING);
    });

    it('TC0004 - Should not canceling ownership when state is not OWNERSHIP_WAITING', async () => {
      const {
        sut,
        mockOwnershipCancelingPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
      } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PENDING },
      );
      mockGetRepository.mockResolvedValue(pixKey);

      const testScript = () => sut.execute(pixKey.user, pixKey.id, reason);
      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);

      expect(mockOwnershipCancelingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.user, pixKey.id);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid called', () => {
    it('TC0005 - Should canceling ownership when state is OWNERSHIP_WAITING', async () => {
      const {
        sut,
        mockOwnershipCancelingPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
      } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_WAITING },
      );
      mockGetRepository.mockResolvedValue(pixKey);

      const result = await sut.execute(pixKey.user, pixKey.id, reason);

      expect(result).toBeDefined();
      expect(result.state).toBe(KeyState.OWNERSHIP_CANCELING);
      expect(mockOwnershipCancelingPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.user, pixKey.id);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledWith(result);
    });
  });
});
