import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  KeyType,
  KeyState,
  PixKeyRepository,
  ClaimReasonType,
  PixKeyEntity,
} from '@zro/pix-keys/domain';
import {
  CancelCodePixKeyUseCase,
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
  PixKeyInvalidTypeException,
} from '@zro/pix-keys/application';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('CancelPixKeyUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
    const {
      eventEmitter,
      mockCanceledPixKeyEvent,
      mockClaimClosingPixKeyEvent,
    } = mockEvent();

    const { pixKeyRepository, mockGetRepository, mockUpdateRepository } =
      mockRepository();

    const sut = new CancelCodePixKeyUseCase(
      logger,
      pixKeyRepository,
      eventEmitter,
    );

    return {
      sut,
      mockCanceledPixKeyEvent,
      mockClaimClosingPixKeyEvent,
      mockGetRepository,
      mockUpdateRepository,
      reason,
    };
  };

  const mockEvent = () => {
    const eventEmitter: PixKeyEventEmitter = createMock<PixKeyEventEmitter>();
    const mockCanceledPixKeyEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.canceledPixKey),
    );
    const mockClaimClosingPixKeyEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.claimClosingPixKey),
    );

    return {
      eventEmitter,
      mockCanceledPixKeyEvent,
      mockClaimClosingPixKeyEvent,
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
    it('TC0001 - Should not cancel pix key without user and id', async () => {
      const {
        sut,
        mockGetRepository,
        mockCanceledPixKeyEvent,
        mockClaimClosingPixKeyEvent,
        reason,
      } = makeSut();

      const { user } = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
      );

      const testScript = () => sut.execute(user, undefined, reason);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not cancel pix key when pix key not found', async () => {
      const {
        sut,
        mockGetRepository,
        mockCanceledPixKeyEvent,
        mockClaimClosingPixKeyEvent,
        reason,
      } = makeSut();

      mockGetRepository.mockReturnValue(undefined);
      const { id, user } = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
      );

      const testScript = () => sut.execute(user, id, reason);
      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);

      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(user, id);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should not cancel pix key when type is not email or phone', async () => {
      const {
        sut,
        mockGetRepository,
        mockCanceledPixKeyEvent,
        mockClaimClosingPixKeyEvent,
        reason,
      } = makeSut();

      const { id, user } = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { type: KeyType.CPF },
      );

      const testScript = () => sut.execute(user, id, reason);
      await expect(testScript).rejects.toThrow(PixKeyInvalidTypeException);

      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(user, id);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should not cancel pix key when state is not pending, claim_pending or claim_closing', async () => {
      const {
        sut,
        mockGetRepository,
        mockCanceledPixKeyEvent,
        mockClaimClosingPixKeyEvent,
        reason,
      } = makeSut();

      const pixKeyFactory = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { type: KeyType.PHONE, state: KeyState.CLAIM_DENIED },
      );
      mockGetRepository.mockResolvedValue(pixKeyFactory);

      const testScript = () =>
        sut.execute(pixKeyFactory.user, pixKeyFactory.id, reason);
      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);

      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(
        pixKeyFactory.user,
        pixKeyFactory.id,
      );
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid called', () => {
    it('TC0005 - Should cancel pix key when state is PENDING', async () => {
      const {
        sut,
        mockCanceledPixKeyEvent,
        mockClaimClosingPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        reason,
      } = makeSut();

      const pixKeyFactory = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { type: KeyType.EMAIL, state: KeyState.PENDING },
      );
      mockGetRepository.mockResolvedValue(pixKeyFactory);

      const pixKey = await sut.execute(
        pixKeyFactory.user,
        pixKeyFactory.id,
        reason,
      );

      expect(pixKey).toBeDefined();
      expect(pixKey.state).toBe(KeyState.CANCELED);

      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledWith(pixKey);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(
        pixKeyFactory.user,
        pixKeyFactory.id,
      );
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledWith(pixKey);
    });

    it('TC0006 - Should cancel pix key when state is CLAIM_PENDING', async () => {
      const {
        sut,
        mockGetRepository,
        mockUpdateRepository,
        mockCanceledPixKeyEvent,
        mockClaimClosingPixKeyEvent,
        reason,
      } = makeSut();

      const pixKeyFactory = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { type: KeyType.PHONE, state: KeyState.CLAIM_PENDING },
      );
      mockGetRepository.mockResolvedValue(pixKeyFactory);

      const pixKey = await sut.execute(
        pixKeyFactory.user,
        pixKeyFactory.id,
        reason,
      );

      expect(pixKey).toBeDefined();
      expect(pixKey.state).toBe(KeyState.CLAIM_CLOSING);

      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledWith(pixKey, reason);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(
        pixKeyFactory.user,
        pixKeyFactory.id,
      );
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledWith(pixKey);
    });
  });
});
