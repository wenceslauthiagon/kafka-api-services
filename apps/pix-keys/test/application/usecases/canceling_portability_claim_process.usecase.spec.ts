import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  ClaimReasonType,
  ClaimStatusType,
  KeyState,
  PixKeyClaimEntity,
  PixKeyClaimRepository,
  PixKeyEntity,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  CancelingPortabilityClaimProcessUseCase as UseCase,
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';
import { PixKeyClaimFactory, PixKeyFactory } from '@zro/test/pix-keys/config';

describe('CancelingPortabilityClaimProcessUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  const reason = ClaimReasonType.USER_REQUESTED;

  const makeSut = () => {
    const { eventEmitter, mockPortabilityCancelingPixKeyEvent } = mockEvent();
    const {
      pixKeyRepository,
      mockGetRepository,
      mockUpdateRepository,
      pixKeyClaimRepository,
      mockGetClaimRepository,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
    );

    return {
      sut,
      mockPortabilityCancelingPixKeyEvent,
      mockGetRepository,
      mockGetClaimRepository,
      mockUpdateRepository,
    };
  };

  const mockEvent = () => {
    const eventEmitter: PixKeyEventEmitter = createMock<PixKeyEventEmitter>();
    const mockPortabilityCancelingPixKeyEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.portabilityCancelingPixKey),
    );
    return {
      eventEmitter,
      mockPortabilityCancelingPixKeyEvent,
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

    const pixKeyClaimRepository: PixKeyClaimRepository =
      createMock<PixKeyClaimRepository>();
    const mockGetClaimRepository: jest.Mock = On(pixKeyClaimRepository).get(
      method((mock) => mock.getById),
    );

    return {
      pixKeyRepository,
      mockGetRepository,
      mockUpdateRepository,
      pixKeyClaimRepository,
      mockGetClaimRepository,
    };
  };

  describe('With invalid called', () => {
    it('TC0001 - Should not canceling portability without id and reason', async () => {
      const {
        sut,
        mockPortabilityCancelingPixKeyEvent,
        mockGetRepository,
        mockGetClaimRepository,
        mockUpdateRepository,
      } = makeSut();

      const testScript = () => sut.execute(null, null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockPortabilityCancelingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not canceling portability when pix key not found', async () => {
      const {
        sut,
        mockPortabilityCancelingPixKeyEvent,
        mockGetRepository,
        mockGetClaimRepository,
        mockUpdateRepository,
      } = makeSut();

      const { id, user } = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
      );
      mockGetRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(user, id, reason);

      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
      expect(mockPortabilityCancelingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(user, id);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not canceling portability when state is already PORTABILITY_CANCELING', async () => {
      const {
        sut,
        mockPortabilityCancelingPixKeyEvent,
        mockGetRepository,
        mockGetClaimRepository,
        mockUpdateRepository,
      } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_CANCELING },
      );
      mockGetRepository.mockResolvedValue(pixKey);

      const result = await sut.execute(pixKey.user, pixKey.id, reason);

      expect(result.state).toEqual(KeyState.PORTABILITY_CANCELING);
      expect(mockPortabilityCancelingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.user, pixKey.id);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not canceling portability when state is not PORTABILITY_STARTED', async () => {
      const {
        sut,
        mockPortabilityCancelingPixKeyEvent,
        mockGetRepository,
        mockGetClaimRepository,
        mockUpdateRepository,
      } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PENDING },
      );
      mockGetRepository.mockResolvedValue(pixKey);

      const testScript = () => sut.execute(pixKey.user, pixKey.id, reason);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockPortabilityCancelingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.user, pixKey.id);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not canceling portability when pixKey has no claim', async () => {
      const {
        sut,
        mockPortabilityCancelingPixKeyEvent,
        mockGetRepository,
        mockGetClaimRepository,
        mockUpdateRepository,
      } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_STARTED, claim: null },
      );
      mockGetRepository.mockResolvedValue(pixKey);

      const testScript = () => sut.execute(pixKey.user, pixKey.id, reason);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockPortabilityCancelingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.user, pixKey.id);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetClaimRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not canceling portability when there is no claim', async () => {
      const {
        sut,
        mockPortabilityCancelingPixKeyEvent,
        mockGetRepository,
        mockGetClaimRepository,
        mockUpdateRepository,
      } = makeSut();

      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
      );
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_STARTED, claim: pixKeyClaim },
      );
      mockGetRepository.mockResolvedValue(pixKey);
      mockGetClaimRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(pixKey.user, pixKey.id, reason);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockPortabilityCancelingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.user, pixKey.id);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetClaimRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0007 - Should not canceling portability when claim status is invalid', async () => {
      const {
        sut,
        mockPortabilityCancelingPixKeyEvent,
        mockGetRepository,
        mockGetClaimRepository,
        mockUpdateRepository,
      } = makeSut();

      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
        { status: ClaimStatusType.OPEN },
      );
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_STARTED, claim: pixKeyClaim },
      );
      mockGetRepository.mockResolvedValue(pixKey);
      mockGetClaimRepository.mockResolvedValue(pixKeyClaim);

      const testScript = () => sut.execute(pixKey.user, pixKey.id, reason);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockPortabilityCancelingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.user, pixKey.id);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetClaimRepository).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid called', () => {
    it('TC0008 - Should canceling portability when state is PORTABILITY_STARTED', async () => {
      const {
        sut,
        mockPortabilityCancelingPixKeyEvent,
        mockGetRepository,
        mockGetClaimRepository,
        mockUpdateRepository,
      } = makeSut();

      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
        { status: ClaimStatusType.WAITING_RESOLUTION },
      );
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_STARTED, claim: pixKeyClaim },
      );
      mockGetRepository.mockResolvedValue(pixKey);
      mockGetClaimRepository.mockResolvedValue(pixKeyClaim);

      const result = await sut.execute(pixKey.user, pixKey.id, reason);

      expect(result).toBeDefined();
      expect(result.state).toBe(KeyState.PORTABILITY_CANCELING);
      expect(mockPortabilityCancelingPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.user, pixKey.id);
      expect(mockGetClaimRepository).toHaveBeenCalledTimes(1);
      expect(mockGetClaimRepository).toHaveBeenCalledWith(pixKey.claim.id);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledWith(result);
    });
  });
});
