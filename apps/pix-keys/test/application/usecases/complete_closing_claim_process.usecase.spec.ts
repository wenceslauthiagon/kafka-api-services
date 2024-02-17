import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { KeyState, PixKeyEntity, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  CompleteClosingClaimProcessUseCase,
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('CompleteClosingClaimProcessUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { eventEmitter, mockClaimClosedPixKeyEvent } = mockEvent();
    const { pixKeyRepository, mockGetRepository, mockUpdateRepository } =
      mockRepository();
    const sut = new CompleteClosingClaimProcessUseCase(
      logger,
      pixKeyRepository,
      eventEmitter,
    );
    return {
      sut,
      mockClaimClosedPixKeyEvent,
      mockGetRepository,
      mockUpdateRepository,
    };
  };

  const mockEvent = () => {
    const eventEmitter: PixKeyEventEmitter = createMock<PixKeyEventEmitter>();
    const mockClaimClosedPixKeyEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.claimClosedPixKey),
    );
    return {
      eventEmitter,
      mockClaimClosedPixKeyEvent,
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
    it('TC0001 - Should not closed claim without key', async () => {
      const {
        sut,
        mockClaimClosedPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
      } = makeSut();
      const testScript = () => sut.execute(undefined);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockClaimClosedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not closed claim when pix key not found', async () => {
      const {
        sut,
        mockClaimClosedPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
      } = makeSut();
      const { key } = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
      );
      mockGetRepository.mockResolvedValue([]);

      const testScript = () => sut.execute(key);
      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);

      expect(mockClaimClosedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should not closed claim when state is already CLAIM_CLOSED', async () => {
      const {
        sut,
        mockClaimClosedPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
      } = makeSut();
      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.CLAIM_CLOSED },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const pixKey = await sut.execute(pixKeyData.key);
      expect(mockClaimClosedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(pixKey.state).toEqual(KeyState.CLAIM_CLOSED);
    });

    it('TC0004 - Should not closed claim when state is not CLAIM_CLOSING', async () => {
      const {
        sut,
        mockClaimClosedPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
      } = makeSut();
      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PENDING },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const testScript = () => sut.execute(pixKeyData.key);
      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);

      expect(mockClaimClosedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid called', () => {
    it('TC0005 - Should closed claim when state is CLAIM_CLOSING', async () => {
      const {
        sut,
        mockClaimClosedPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
      } = makeSut();
      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.CLAIM_CLOSING },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const pixKey = await sut.execute(pixKeyData.key);

      expect(pixKey).toBeDefined();
      expect(pixKey.state).toBe(KeyState.CLAIM_CLOSED);

      expect(mockClaimClosedPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledWith(pixKey);
    });
  });
});
