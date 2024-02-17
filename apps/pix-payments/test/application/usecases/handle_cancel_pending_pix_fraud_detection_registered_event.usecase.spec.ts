import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixFraudDetectionEntity,
  PixFraudDetectionRepository,
  PixFraudDetectionState,
} from '@zro/pix-payments/domain';
import {
  HandleCancelPendingPixFraudDetectionRegisteredEventUseCase as UseCase,
  PixFraudDetectionEventEmitter,
  PixFraudDetectionInvalidStateException,
  PixFraudDetectionGateway,
  PixFraudDetectionNotFoundException,
} from '@zro/pix-payments/application';
import { PixFraudDetectionFactory } from '@zro/test/pix-payments/config';

describe('HandleCancelPendingPixFraudDetectionRegisteredEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockGateway = () => {
    const gateway: PixFraudDetectionGateway =
      createMock<PixFraudDetectionGateway>();
    const mockCancelGateway: jest.Mock = On(gateway).get(
      method((mock) => mock.cancelFraudDetection),
    );

    return {
      gateway,
      mockCancelGateway,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: PixFraudDetectionEventEmitter =
      createMock<PixFraudDetectionEventEmitter>();
    const mockEmitEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.cancelConfirmedPixFraudDetectionRegistered),
    );

    return {
      eventEmitter,
      mockEmitEvent,
    };
  };

  const mockRepository = () => {
    const repository: PixFraudDetectionRepository =
      createMock<PixFraudDetectionRepository>();
    const mockGetByIdRepository: jest.Mock = On(repository).get(
      method((mock) => mock.getById),
    );
    const mockUpdateRepository: jest.Mock = On(repository).get(
      method((mock) => mock.update),
    );

    return {
      repository,
      mockGetByIdRepository,
      mockUpdateRepository,
    };
  };

  const makeSut = () => {
    const { repository, mockGetByIdRepository, mockUpdateRepository } =
      mockRepository();

    const { eventEmitter, mockEmitEvent } = mockEmitter();

    const { gateway, mockCancelGateway } = mockGateway();

    const sut = new UseCase(logger, repository, gateway, eventEmitter);

    return {
      sut,
      mockGetByIdRepository,
      mockUpdateRepository,
      mockEmitEvent,
      mockCancelGateway,
    };
  };
  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing data.', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
        mockCancelGateway,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
      expect(mockCancelGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw PixFraudDetectionNotFoundException if pixFraudDetection is not found.', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
        mockCancelGateway,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
        );

      mockGetByIdRepository.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(pixFraudDetection.id);

      await expect(testScript).rejects.toThrow(
        PixFraudDetectionNotFoundException,
      );
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
      expect(mockCancelGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should return if state is already CANCELED_REGISTERED_CONFIRMED.', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
        mockCancelGateway,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            state: PixFraudDetectionState.CANCELED_REGISTERED_CONFIRMED,
          },
        );

      mockGetByIdRepository.mockResolvedValueOnce(pixFraudDetection);

      await sut.execute(pixFraudDetection.id);

      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
      expect(mockCancelGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw PixFraudDetectionInvalidStateException if state is already canceled.', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
        mockCancelGateway,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            state: PixFraudDetectionState.CANCELED_RECEIVED_CONFIRMED,
          },
        );

      mockGetByIdRepository.mockResolvedValueOnce(pixFraudDetection);

      const testScript = () => sut.execute(pixFraudDetection.id);

      await expect(testScript).rejects.toThrow(
        PixFraudDetectionInvalidStateException,
      );
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
      expect(mockCancelGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should execute pixFraudDetection successfully.', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
        mockCancelGateway,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            state: PixFraudDetectionState.CANCELED_REGISTERED_PENDING,
          },
        );

      mockGetByIdRepository.mockResolvedValueOnce(pixFraudDetection);

      const result = await sut.execute(pixFraudDetection.id);

      expect(result.state).toBe(
        PixFraudDetectionState.CANCELED_REGISTERED_CONFIRMED,
      );
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockCancelGateway).toHaveBeenCalledTimes(1);
    });
  });
});
