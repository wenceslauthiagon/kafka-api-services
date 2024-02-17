import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixFraudDetectionEntity,
  PixFraudDetectionRepository,
  PixFraudDetectionStatus,
} from '@zro/pix-payments/domain';
import {
  HandleCancelPixFraudDetectionReceivedEventUseCase as UseCase,
  PixFraudDetectionEventEmitter,
  PixFraudDetectionInvalidStateException,
} from '@zro/pix-payments/application';
import { PixFraudDetectionFactory } from '@zro/test/pix-payments/config';

describe('HandleCancelPixFraudDetectionReceivedEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixFraudDetectionEventEmitter =
      createMock<PixFraudDetectionEventEmitter>();
    const mockReceivedPendingEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.cancelPendingPixFraudDetectionReceived),
    );

    return {
      eventEmitter,
      mockReceivedPendingEvent,
    };
  };

  const mockRepository = () => {
    const repository: PixFraudDetectionRepository =
      createMock<PixFraudDetectionRepository>();
    const mockGetByExternalIdRepository: jest.Mock = On(repository).get(
      method((mock) => mock.getByExternalId),
    );
    const mockUpdateRepository: jest.Mock = On(repository).get(
      method((mock) => mock.update),
    );

    return {
      repository,
      mockGetByExternalIdRepository,
      mockUpdateRepository,
    };
  };

  const makeSut = () => {
    const { repository, mockGetByExternalIdRepository, mockUpdateRepository } =
      mockRepository();

    const { eventEmitter, mockReceivedPendingEvent } = mockEmitter();

    const sut = new UseCase(logger, repository, eventEmitter);

    return {
      sut,
      mockGetByExternalIdRepository,
      mockUpdateRepository,
      mockReceivedPendingEvent,
    };
  };
  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if there is missing data.', async () => {
      const {
        sut,
        mockGetByExternalIdRepository,
        mockUpdateRepository,
        mockReceivedPendingEvent,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
        );

      const testScripts = [
        () => sut.execute(null),
        () => sut.execute({ ...pixFraudDetection, externalId: null }),
        () => sut.execute({ ...pixFraudDetection, status: null }),
      ];

      for (const testScript of testScripts) {
        await expect(testScript).rejects.toThrow(MissingDataException);
        expect(mockGetByExternalIdRepository).toHaveBeenCalledTimes(0);
        expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
        expect(mockReceivedPendingEvent).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0002 - Should return id pixFraudDetection is not found.', async () => {
      const {
        sut,
        mockGetByExternalIdRepository,
        mockUpdateRepository,
        mockReceivedPendingEvent,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
        );

      mockGetByExternalIdRepository.mockResolvedValueOnce(null);

      await sut.execute(pixFraudDetection);

      expect(mockGetByExternalIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockReceivedPendingEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw PixFraudDetectionInvalidStateException if state is already canceled.', async () => {
      const {
        sut,
        mockGetByExternalIdRepository,
        mockUpdateRepository,
        mockReceivedPendingEvent,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            status: PixFraudDetectionStatus.CANCELED_RECEIVED,
          },
        );

      mockGetByExternalIdRepository.mockResolvedValueOnce(pixFraudDetection);

      const testScript = () => sut.execute(pixFraudDetection);

      await expect(testScript).rejects.toThrow(
        PixFraudDetectionInvalidStateException,
      );
      expect(mockGetByExternalIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockReceivedPendingEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should execute pixFraudDetection successfully.', async () => {
      const {
        sut,
        mockGetByExternalIdRepository,
        mockUpdateRepository,
        mockReceivedPendingEvent,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            status: PixFraudDetectionStatus.RECEIVED,
          },
        );

      mockGetByExternalIdRepository.mockResolvedValueOnce(pixFraudDetection);

      await sut.execute(pixFraudDetection);

      expect(mockGetByExternalIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockReceivedPendingEvent).toHaveBeenCalledTimes(1);
    });
  });
});
