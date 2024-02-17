import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { KeyState, PixKeyEntity, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  HandleOwnershipPendingExpiredPixKeyUseCase as UseCase,
  PixKeyEventEmitter,
} from '@zro/pix-keys/application';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('HandleOwnershipPendingExpiredPixKeyUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { eventEmitter, mockCanceledPixKeyEvent } = mockEvent();
    const { pixKeyRepository, mockGetByIdRepository, mockUpdateRepository } =
      mockRepository();
    const sut = new UseCase(logger, pixKeyRepository, eventEmitter);
    return {
      sut,
      mockCanceledPixKeyEvent,
      mockGetByIdRepository,
      mockUpdateRepository,
    };
  };

  const mockEvent = () => {
    const eventEmitter: PixKeyEventEmitter = createMock<PixKeyEventEmitter>();
    const mockCanceledPixKeyEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.canceledPixKey),
    );

    return {
      eventEmitter,
      mockCanceledPixKeyEvent,
    };
  };

  const mockRepository = () => {
    const pixKeyRepository: PixKeyRepository = createMock<PixKeyRepository>();
    const mockGetByIdRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.getByIdAndStateIsNotCanceled),
    );
    const mockUpdateRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.update),
    );

    return { pixKeyRepository, mockGetByIdRepository, mockUpdateRepository };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should cancel key successfully', async () => {
      const {
        sut,
        mockCanceledPixKeyEvent,
        mockGetByIdRepository,
        mockUpdateRepository,
      } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        {
          state: KeyState.OWNERSHIP_PENDING,
        },
      );

      mockGetByIdRepository.mockResolvedValueOnce(pixKey);

      await sut.execute(pixKey.id);

      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not cancel key if missing param', async () => {
      const {
        sut,
        mockCanceledPixKeyEvent,
        mockGetByIdRepository,
        mockUpdateRepository,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not cancel key if pix key not exists', async () => {
      const {
        sut,
        mockCanceledPixKeyEvent,
        mockGetByIdRepository,
        mockUpdateRepository,
      } = makeSut();

      mockGetByIdRepository.mockResolvedValueOnce(null);

      await sut.execute(uuidV4());

      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not cancel key if state is not OWNERSHIP_PENDING', async () => {
      const {
        sut,
        mockCanceledPixKeyEvent,
        mockGetByIdRepository,
        mockUpdateRepository,
      } = makeSut();

      const state = KeyState.OWNERSHIP_OPENED;

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        {
          state,
        },
      );

      mockGetByIdRepository.mockResolvedValueOnce(pixKey);

      const result = await sut.execute(pixKey.id);

      expect(result.state).toEqual(state);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
    });
  });
});
