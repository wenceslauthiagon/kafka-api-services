import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixFraudDetectionEntity,
  PixFraudDetectionRepository,
  PixFraudDetectionState,
  PixFraudDetectionStatus,
} from '@zro/pix-payments/domain';
import {
  CancelPixFraudDetectionRegisteredUseCase as UseCase,
  PixFraudDetectionEventEmitter,
  PixFraudDetectionNotFoundException,
} from '@zro/pix-payments/application';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { PixFraudDetectionFactory } from '@zro/test/pix-payments/config';

describe('CancelPixFraudDetectionRegisteredUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixFraudDetectionEventEmitter =
      createMock<PixFraudDetectionEventEmitter>();
    const mockEmitEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.cancelPendingPixFraudDetectionRegistered),
    );

    return {
      eventEmitter,
      mockEmitEvent,
    };
  };

  const mockRepository = () => {
    const repository: PixFraudDetectionRepository =
      createMock<PixFraudDetectionRepository>();
    const mockGetByIssueIdRepository: jest.Mock = On(repository).get(
      method((mock) => mock.getByIssueId),
    );
    const mockUpdateRepository: jest.Mock = On(repository).get(
      method((mock) => mock.update),
    );

    return {
      repository,
      mockGetByIssueIdRepository,
      mockUpdateRepository,
    };
  };

  const makeSut = () => {
    const { repository, mockGetByIssueIdRepository, mockUpdateRepository } =
      mockRepository();

    const { eventEmitter, mockEmitEvent } = mockEmitter();

    const sut = new UseCase(logger, repository, eventEmitter);

    return {
      sut,
      mockGetByIssueIdRepository,
      mockUpdateRepository,
      mockEmitEvent,
    };
  };
  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing params.', async () => {
      const {
        sut,
        mockGetByIssueIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByIssueIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw PixFraudDetectionNotFoundException when no pixFraudDetection is found.', async () => {
      const {
        sut,
        mockGetByIssueIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
      } = makeSut();

      mockGetByIssueIdRepository.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(faker.datatype.number({ min: 1, max: 999 }));

      await expect(testScript).rejects.toThrow(
        PixFraudDetectionNotFoundException,
      );
      expect(mockGetByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should return when status is related to received pixFraudDetections.', async () => {
      const {
        sut,
        mockGetByIssueIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            status: PixFraudDetectionStatus.RECEIVED,
            issueId: faker.datatype.number({ min: 1, max: 999 }),
          },
        );

      mockGetByIssueIdRepository.mockResolvedValue(pixFraudDetection);

      const testScript = await sut.execute(
        faker.datatype.number(pixFraudDetection.issueId),
      );

      expect(testScript).toBeUndefined();
      expect(mockGetByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should return when status is related to received canceled pixFraudDetections.', async () => {
      const {
        sut,
        mockGetByIssueIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            status: PixFraudDetectionStatus.CANCELED_RECEIVED,
            issueId: faker.datatype.number({ min: 1, max: 999 }),
          },
        );

      mockGetByIssueIdRepository.mockResolvedValue(pixFraudDetection);

      const testScript = await sut.execute(pixFraudDetection.issueId);

      expect(testScript).toBeUndefined();
      expect(mockGetByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should return when state is CANCELED_REGISTERED_PENDING.', async () => {
      const {
        sut,
        mockGetByIssueIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            state: PixFraudDetectionState.CANCELED_REGISTERED_PENDING,
            issueId: faker.datatype.number({ min: 1, max: 999 }),
          },
        );

      mockGetByIssueIdRepository.mockResolvedValue(pixFraudDetection);

      const testScript = await sut.execute(pixFraudDetection.issueId);

      expect(testScript).toBeUndefined();
      expect(mockGetByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should return when state is CANCELED_REGISTERED_CONFIRMED.', async () => {
      const {
        sut,
        mockGetByIssueIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            state: PixFraudDetectionState.CANCELED_REGISTERED_CONFIRMED,
            issueId: faker.datatype.number({ min: 1, max: 999 }),
          },
        );

      mockGetByIssueIdRepository.mockResolvedValue(pixFraudDetection);

      const testScript = await sut.execute(pixFraudDetection.issueId);

      expect(testScript).toBeUndefined();
      expect(mockGetByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should execute successfully.', async () => {
      const {
        sut,
        mockGetByIssueIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            status: PixFraudDetectionStatus.REGISTERED,
            state: PixFraudDetectionState.REGISTERED_CONFIRMED,
            issueId: faker.datatype.number({ min: 1, max: 999 }),
          },
        );

      mockGetByIssueIdRepository.mockResolvedValue(pixFraudDetection);

      const result = await sut.execute(pixFraudDetection.issueId);

      expect(result).toBeDefined();
      expect(result.state).toBe(
        PixFraudDetectionState.CANCELED_REGISTERED_PENDING,
      );
      expect(result.status).toBe(PixFraudDetectionStatus.CANCELED_REGISTERED);
      expect(mockGetByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
    });
  });
});
