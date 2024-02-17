import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  getMoment,
  defaultLogger as logger,
} from '@zro/common';
import {
  ClaimReasonType,
  KeyState,
  PixKeyClaimEntity,
  PixKeyClaimRepository,
  PixKeyEntity,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  SyncPortabilityRequestPendingPixKeyUseCase as UseCase,
  PixKeyEventEmitter,
} from '@zro/pix-keys/application';
import { PixKeyClaimFactory, PixKeyFactory } from '@zro/test/pix-keys/config';

const DAY_IN_SECONDS = 24 * 60 * 60;
const TIMESTAMP = 7 * DAY_IN_SECONDS; // 7 days in seconds.

describe('SyncPortabilityRequestPendingPixKeyUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      eventEmitter,
      mockPortabilityRequestConfirmOpenedExpiredPixKeyEvent,
    } = mockEvent();
    const {
      pixKeyRepository,
      mockGetByStateRepository,
      pixKeyClaimRepository,
      mockGetByIdAndLessOpeningDatePixKeyClaimRepository,
    } = mockRepository();
    const sut = new UseCase(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
      TIMESTAMP,
    );
    return {
      sut,
      mockPortabilityRequestConfirmOpenedExpiredPixKeyEvent,
      mockGetByStateRepository,
      mockGetByIdAndLessOpeningDatePixKeyClaimRepository,
    };
  };

  const mockEvent = () => {
    const eventEmitter: PixKeyEventEmitter = createMock<PixKeyEventEmitter>();
    const mockPortabilityRequestConfirmOpenedExpiredPixKeyEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.portabilityRequestConfirmOpenedPixKey));

    return {
      eventEmitter,
      mockPortabilityRequestConfirmOpenedExpiredPixKeyEvent,
    };
  };

  const mockRepository = () => {
    const pixKeyRepository: PixKeyRepository = createMock<PixKeyRepository>();
    const mockGetByStateRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.getByState),
    );

    const pixKeyClaimRepository: PixKeyClaimRepository =
      createMock<PixKeyClaimRepository>();
    const mockGetByIdAndLessOpeningDatePixKeyClaimRepository: jest.Mock = On(
      pixKeyClaimRepository,
    ).get(method((mock) => mock.getByIdAndLessOpeningDate));

    return {
      pixKeyRepository,
      mockGetByStateRepository,
      pixKeyClaimRepository,
      mockGetByIdAndLessOpeningDatePixKeyClaimRepository,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle key successfully', async () => {
      const {
        sut,
        mockPortabilityRequestConfirmOpenedExpiredPixKeyEvent,
        mockGetByStateRepository,
        mockGetByIdAndLessOpeningDatePixKeyClaimRepository,
      } = makeSut();

      const expiredDate = getMoment()
        .subtract(TIMESTAMP, 'seconds')
        .subtract(DAY_IN_SECONDS, 'seconds')
        .toDate();

      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
        { claimOpeningDate: expiredDate },
      );

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_REQUEST_PENDING, claim: pixKeyClaim },
      );
      mockGetByStateRepository.mockResolvedValue([pixKey]);

      mockGetByIdAndLessOpeningDatePixKeyClaimRepository.mockResolvedValue(
        pixKeyClaim,
      );

      const result = await sut.execute(ClaimReasonType.DEFAULT_OPERATION);

      expect(result).toBeDefined();
      result.forEach((res) => {
        expect(res.state).toBe(KeyState.PORTABILITY_REQUEST_CONFIRM_OPENED);
      });
      expect(
        mockPortabilityRequestConfirmOpenedExpiredPixKeyEvent,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not handle key without reason', async () => {
      const {
        sut,
        mockPortabilityRequestConfirmOpenedExpiredPixKeyEvent,
        mockGetByStateRepository,
        mockGetByIdAndLessOpeningDatePixKeyClaimRepository,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(
        mockPortabilityRequestConfirmOpenedExpiredPixKeyEvent,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetByStateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetByIdAndLessOpeningDatePixKeyClaimRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not handle key with another state', async () => {
      const {
        sut,
        mockPortabilityRequestConfirmOpenedExpiredPixKeyEvent,
        mockGetByStateRepository,
        mockGetByIdAndLessOpeningDatePixKeyClaimRepository,
      } = makeSut();

      mockGetByStateRepository.mockResolvedValue([]);

      const result = await sut.execute(ClaimReasonType.DEFAULT_OPERATION);

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
      expect(
        mockPortabilityRequestConfirmOpenedExpiredPixKeyEvent,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetByStateRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetByIdAndLessOpeningDatePixKeyClaimRepository,
      ).toHaveBeenCalledTimes(0);
    });
    it('TC0004 - Should not handle key when claim opening date not expired', async () => {
      const {
        sut,
        mockPortabilityRequestConfirmOpenedExpiredPixKeyEvent,
        mockGetByStateRepository,
        mockGetByIdAndLessOpeningDatePixKeyClaimRepository,
      } = makeSut();

      const notExpiredDate = getMoment()
        .subtract(TIMESTAMP, 'seconds')
        .add(DAY_IN_SECONDS, 'seconds')
        .toDate();

      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
        { claimOpeningDate: notExpiredDate },
      );

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_REQUEST_PENDING, claim: pixKeyClaim },
      );
      mockGetByStateRepository.mockResolvedValue([pixKey]);

      mockGetByIdAndLessOpeningDatePixKeyClaimRepository.mockResolvedValue(
        null,
      );

      const result = await sut.execute(ClaimReasonType.DEFAULT_OPERATION);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(mockGetByStateRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetByIdAndLessOpeningDatePixKeyClaimRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockPortabilityRequestConfirmOpenedExpiredPixKeyEvent,
      ).toHaveBeenCalledTimes(0);
    });
    it('TC0005 - Should not handle key when claim not found', async () => {
      const {
        sut,
        mockPortabilityRequestConfirmOpenedExpiredPixKeyEvent,
        mockGetByStateRepository,
        mockGetByIdAndLessOpeningDatePixKeyClaimRepository,
      } = makeSut();

      const notExpiredDate = getMoment()
        .subtract(TIMESTAMP, 'seconds')
        .add(DAY_IN_SECONDS, 'seconds')
        .toDate();

      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
        { claimOpeningDate: notExpiredDate },
      );

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_REQUEST_PENDING, claim: pixKeyClaim },
      );

      const pixKeyWithoutClaim = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_REQUEST_PENDING },
      );
      mockGetByStateRepository.mockResolvedValue([pixKeyWithoutClaim, pixKey]);

      const result = await sut.execute(ClaimReasonType.DEFAULT_OPERATION);

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(mockGetByStateRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetByIdAndLessOpeningDatePixKeyClaimRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockPortabilityRequestConfirmOpenedExpiredPixKeyEvent,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
