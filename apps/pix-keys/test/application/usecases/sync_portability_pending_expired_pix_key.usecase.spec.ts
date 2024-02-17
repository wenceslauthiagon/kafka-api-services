import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { KeyState, PixKeyEntity, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  SyncPortabilityPendingExpiredPixKeyUseCase as UseCase,
  PixKeyEventEmitter,
} from '@zro/pix-keys/application';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

const TIMESTAMP = 30 * 24 * 60 * 60; // 30 days.

describe('SyncPortabilityPendingExpiredPixKeyUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { eventEmitter, mockPortabilityPendingExpiredPixKeyEvent } =
      mockEvent();
    const { pixKeyRepository, mockGetRepository } = mockRepository();

    const sut = new UseCase(logger, pixKeyRepository, eventEmitter, TIMESTAMP);

    return {
      sut,
      mockPortabilityPendingExpiredPixKeyEvent,
      mockGetRepository,
    };
  };

  const mockEvent = () => {
    const eventEmitter: PixKeyEventEmitter = createMock<PixKeyEventEmitter>();
    const mockPortabilityPendingExpiredPixKeyEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.portabilityPendingExpiredPixKey));

    return {
      eventEmitter,
      mockPortabilityPendingExpiredPixKeyEvent,
    };
  };

  const mockRepository = () => {
    const pixKeyRepository: PixKeyRepository = createMock<PixKeyRepository>();
    const mockGetRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.getByLessUpdatedAtAndStateIn),
    );

    return { pixKeyRepository, mockGetRepository };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle key successfully', async () => {
      const {
        sut,
        mockPortabilityPendingExpiredPixKeyEvent,
        mockGetRepository,
      } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_PENDING },
      );
      mockGetRepository.mockResolvedValue([pixKey]);

      const result = await sut.execute();

      expect(result).toBeDefined();
      result.forEach((res) => {
        expect(res.state).toBe(KeyState.PORTABILITY_PENDING);
      });
      expect(mockPortabilityPendingExpiredPixKeyEvent).toHaveBeenCalledTimes(
        result.length,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not handle key with PEDING state', async () => {
      const {
        sut,
        mockPortabilityPendingExpiredPixKeyEvent,
        mockGetRepository,
      } = makeSut();

      mockGetRepository.mockResolvedValue([]);

      const result = await sut.execute();

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
      expect(mockPortabilityPendingExpiredPixKeyEvent).toHaveBeenCalledTimes(0);
    });
  });
});
