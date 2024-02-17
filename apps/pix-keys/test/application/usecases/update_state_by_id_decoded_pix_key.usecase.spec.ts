import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  UpdateStateByIdDecodedPixKeyUseCase as UseCase,
  DecodedPixKeyEventEmitter,
  DecodedPixKeyNotFoundException,
  DecodedPixKeyInvalidStateException,
} from '@zro/pix-keys/application';
import {
  DecodedPixKeyEntity,
  DecodedPixKeyRepository,
  DecodedPixKeyState,
} from '@zro/pix-keys/domain';
import { DecodedPixKeyFactory } from '@zro/test/pix-keys/config';

describe('UpdateRemittanceExposureRuleUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const decodedPixKeyEmitter: DecodedPixKeyEventEmitter =
      createMock<DecodedPixKeyEventEmitter>();
    const mockConfirmedEvent: jest.Mock = On(decodedPixKeyEmitter).get(
      method((mock) => mock.confirmedDecodedPixKey),
    );
    const mockPendingEvent: jest.Mock = On(decodedPixKeyEmitter).get(
      method((mock) => mock.pendingDecodedPixKey),
    );
    const mockErrorEvent: jest.Mock = On(decodedPixKeyEmitter).get(
      method((mock) => mock.errorDecodedPixKey),
    );

    return {
      decodedPixKeyEmitter,
      mockConfirmedEvent,
      mockPendingEvent,
      mockErrorEvent,
    };
  };

  const mockRepository = () => {
    const decodedPixKeyRepository: DecodedPixKeyRepository =
      createMock<DecodedPixKeyRepository>();
    const mockGetByIdRepository: jest.Mock = On(decodedPixKeyRepository).get(
      method((mock) => mock.getById),
    );
    const mockUpdateRepository: jest.Mock = On(decodedPixKeyRepository).get(
      method((mock) => mock.update),
    );

    return {
      decodedPixKeyRepository,
      mockGetByIdRepository,
      mockUpdateRepository,
    };
  };

  const makeSut = () => {
    const {
      decodedPixKeyEmitter,
      mockConfirmedEvent,
      mockPendingEvent,
      mockErrorEvent,
    } = mockEmitter();

    const {
      decodedPixKeyRepository,
      mockGetByIdRepository,
      mockUpdateRepository,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      decodedPixKeyRepository,
      decodedPixKeyEmitter,
    );

    return {
      sut,
      mockConfirmedEvent,
      mockPendingEvent,
      mockErrorEvent,
      mockGetByIdRepository,
      mockUpdateRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params.', async () => {
      const {
        sut,
        mockConfirmedEvent,
        mockPendingEvent,
        mockErrorEvent,
        mockGetByIdRepository,
        mockUpdateRepository,
      } = makeSut();

      const testScripts = [
        () => sut.execute(null, null),
        () => sut.execute(null, DecodedPixKeyState.CONFIRMED),
        () => sut.execute(uuidV4(), null),
      ];

      for (const testScript of testScripts) {
        await expect(testScript).rejects.toThrow(MissingDataException);
        expect(mockConfirmedEvent).toHaveBeenCalledTimes(0);
        expect(mockPendingEvent).toHaveBeenCalledTimes(0);
        expect(mockErrorEvent).toHaveBeenCalledTimes(0);
        expect(mockGetByIdRepository).toHaveBeenCalledTimes(0);
        expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0002 - Should throw DecodedPixKeyNotFoundException if decodedPixKey does not exist.', async () => {
      const {
        sut,
        mockConfirmedEvent,
        mockPendingEvent,
        mockErrorEvent,
        mockGetByIdRepository,
        mockUpdateRepository,
      } = makeSut();

      mockGetByIdRepository.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(uuidV4(), DecodedPixKeyState.CONFIRMED);

      await expect(testScript).rejects.toThrow(DecodedPixKeyNotFoundException);
      expect(mockConfirmedEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingEvent).toHaveBeenCalledTimes(0);
      expect(mockErrorEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw DecodedPixKeyInvalidStateException if decodedPixKey state is invalid.', async () => {
      const {
        sut,
        mockConfirmedEvent,
        mockPendingEvent,
        mockErrorEvent,
        mockGetByIdRepository,
        mockUpdateRepository,
      } = makeSut();

      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
        );

      mockGetByIdRepository.mockResolvedValue(decodedPixKey);

      const testScript = () =>
        sut.execute(uuidV4(), 'invalidState' as DecodedPixKeyState);

      await expect(testScript).rejects.toThrow(
        DecodedPixKeyInvalidStateException,
      );
      expect(mockConfirmedEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingEvent).toHaveBeenCalledTimes(0);
      expect(mockErrorEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should update and emit confirmedDecodedPixKey event.', async () => {
      const {
        sut,
        mockConfirmedEvent,
        mockPendingEvent,
        mockErrorEvent,
        mockGetByIdRepository,
        mockUpdateRepository,
      } = makeSut();

      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          {
            state: DecodedPixKeyState.CONFIRMED,
          },
        );

      mockGetByIdRepository.mockResolvedValue(decodedPixKey);

      const result = await sut.execute(decodedPixKey.id, decodedPixKey.state);

      expect(result).toBeDefined;
      expect(result.id).toBe(decodedPixKey.id);
      expect(result.state).toBe(decodedPixKey.state);
      expect(mockConfirmedEvent).toHaveBeenCalledTimes(1);
      expect(mockPendingEvent).toHaveBeenCalledTimes(0);
      expect(mockErrorEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should update and emit pendingDecodedPixKey event.', async () => {
      const {
        sut,
        mockConfirmedEvent,
        mockPendingEvent,
        mockErrorEvent,
        mockGetByIdRepository,
        mockUpdateRepository,
      } = makeSut();

      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          {
            state: DecodedPixKeyState.PENDING,
          },
        );

      mockGetByIdRepository.mockResolvedValue(decodedPixKey);

      const result = await sut.execute(decodedPixKey.id, decodedPixKey.state);

      expect(result).toBeDefined;
      expect(result.id).toBe(decodedPixKey.id);
      expect(result.state).toBe(decodedPixKey.state);
      expect(mockConfirmedEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingEvent).toHaveBeenCalledTimes(1);
      expect(mockErrorEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should update and emit errorDecodedPixKey event.', async () => {
      const {
        sut,
        mockConfirmedEvent,
        mockPendingEvent,
        mockErrorEvent,
        mockGetByIdRepository,
        mockUpdateRepository,
      } = makeSut();

      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          {
            state: DecodedPixKeyState.ERROR,
          },
        );

      mockGetByIdRepository.mockResolvedValue(decodedPixKey);

      const result = await sut.execute(decodedPixKey.id, decodedPixKey.state);

      expect(result).toBeDefined;
      expect(result.id).toBe(decodedPixKey.id);
      expect(result.state).toBe(decodedPixKey.state);
      expect(mockConfirmedEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingEvent).toHaveBeenCalledTimes(0);
      expect(mockErrorEvent).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
    });
  });
});
