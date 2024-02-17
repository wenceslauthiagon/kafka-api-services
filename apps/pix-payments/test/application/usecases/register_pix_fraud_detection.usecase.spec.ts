import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixFraudDetectionEntity,
  PixFraudDetectionRepository,
  PixFraudDetectionStatus,
} from '@zro/pix-payments/domain';
import {
  RegisterPixFraudDetectionUseCase as UseCase,
  PixFraudDetectionEventEmitter,
} from '@zro/pix-payments/application';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { PixFraudDetectionFactory } from '@zro/test/pix-payments/config';

describe('RegisterPixFraudDetectionUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixFraudDetectionEventEmitter =
      createMock<PixFraudDetectionEventEmitter>();
    const mockEmitEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.registerPendingPixFraudDetection),
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
    const mockCreateRepository: jest.Mock = On(repository).get(
      method((mock) => mock.create),
    );

    return {
      repository,
      mockGetByIssueIdRepository,
      mockCreateRepository,
    };
  };

  const makeSut = () => {
    const { repository, mockGetByIssueIdRepository, mockCreateRepository } =
      mockRepository();

    const { eventEmitter, mockEmitEvent } = mockEmitter();

    const sut = new UseCase(logger, repository, eventEmitter);

    return {
      sut,
      mockGetByIssueIdRepository,
      mockCreateRepository,
      mockEmitEvent,
    };
  };
  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if there is missing data.', async () => {
      const {
        sut,
        mockGetByIssueIdRepository,
        mockCreateRepository,
        mockEmitEvent,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            issueId: faker.datatype.number({ min: 1, max: 999 }),
          },
        );

      const testScripts = [
        () => sut.execute(null, null, null, null),
        () =>
          sut.execute(
            null,
            pixFraudDetection.issueId,
            pixFraudDetection.document,
            pixFraudDetection.fraudType,
          ),
        () =>
          sut.execute(
            pixFraudDetection.id,
            null,
            pixFraudDetection.document,
            pixFraudDetection.fraudType,
          ),
        () =>
          sut.execute(
            pixFraudDetection.id,
            pixFraudDetection.issueId,
            null,
            pixFraudDetection.fraudType,
          ),
        () =>
          sut.execute(
            pixFraudDetection.id,
            pixFraudDetection.issueId,
            pixFraudDetection.document,
            null,
          ),
      ];

      for (const testScript of testScripts) {
        await expect(testScript).rejects.toThrow(MissingDataException);
        expect(mockGetByIssueIdRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateRepository).toHaveBeenCalledTimes(0);
        expect(mockEmitEvent).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0002 - Should return if pixFraudDetection already exists.', async () => {
      const {
        sut,
        mockGetByIssueIdRepository,
        mockCreateRepository,
        mockEmitEvent,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            issueId: faker.datatype.number({ min: 1, max: 999 }),
            status: PixFraudDetectionStatus.REGISTERED,
          },
        );
      mockGetByIssueIdRepository.mockResolvedValueOnce(pixFraudDetection);

      const result = await sut.execute(
        pixFraudDetection.id,
        pixFraudDetection.issueId,
        pixFraudDetection.document,
        pixFraudDetection.fraudType,
      );

      expect(result).toMatchObject(pixFraudDetection);
      expect(mockGetByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should execute pixFraudDetection successfully.', async () => {
      const {
        sut,
        mockGetByIssueIdRepository,
        mockCreateRepository,
        mockEmitEvent,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            issueId: faker.datatype.number({ min: 1, max: 999 }),
            status: PixFraudDetectionStatus.REGISTERED,
          },
        );

      mockGetByIssueIdRepository.mockResolvedValueOnce(null);

      const result = await sut.execute(
        pixFraudDetection.id,
        pixFraudDetection.issueId,
        pixFraudDetection.document,
        pixFraudDetection.fraudType,
      );

      expect(result).toBeDefined();
      expect(mockGetByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
    });
  });
});
