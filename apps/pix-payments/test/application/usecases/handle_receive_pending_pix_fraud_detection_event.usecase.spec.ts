import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixFraudDetectionEntity,
  PixFraudDetectionRepository,
  PixFraudDetectionState,
} from '@zro/pix-payments/domain';
import {
  HandleReceivePendingPixFraudDetectionEventUseCase as UseCase,
  PixFraudDetectionEventEmitter,
  PixFraudDetectionInvalidStateException,
  IssuePixFraudDetectionGateway,
  PixFraudDetectionNotFoundException,
} from '@zro/pix-payments/application';
import { PixFraudDetectionFactory } from '@zro/test/pix-payments/config';

describe('HandleReceivePendingPixFraudDetectionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockGateway = () => {
    const issueGateway: IssuePixFraudDetectionGateway =
      createMock<IssuePixFraudDetectionGateway>();
    const mockCreateIssue: jest.Mock = On(issueGateway).get(
      method((mock) => mock.createPixFraudDetectionIssue),
    );

    return {
      issueGateway,
      mockCreateIssue,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: PixFraudDetectionEventEmitter =
      createMock<PixFraudDetectionEventEmitter>();
    const mockEmitEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.receivedConfirmedPixFraudDetection),
    );

    return {
      eventEmitter,
      mockEmitEvent,
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
    const { issueGateway, mockCreateIssue } = mockGateway();

    const { repository, mockGetByExternalIdRepository, mockUpdateRepository } =
      mockRepository();

    const { eventEmitter, mockEmitEvent } = mockEmitter();

    const sut = new UseCase(logger, repository, issueGateway, eventEmitter);

    return {
      sut,
      mockGetByExternalIdRepository,
      mockUpdateRepository,
      mockEmitEvent,
      mockCreateIssue,
    };
  };
  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if there is missing data.', async () => {
      const {
        sut,
        mockGetByExternalIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
        mockCreateIssue,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
        );

      const testScripts = [
        () => sut.execute(null),
        () => sut.execute({ ...pixFraudDetection, externalId: null }),
      ];

      for (const testScript of testScripts) {
        await expect(testScript).rejects.toThrow(MissingDataException);
        expect(mockGetByExternalIdRepository).toHaveBeenCalledTimes(0);
        expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
        expect(mockEmitEvent).toHaveBeenCalledTimes(0);
        expect(mockCreateIssue).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0002 - Should throw PixFraudDetectionNotFoundException if pixFraudDetection is not found.', async () => {
      const {
        sut,
        mockGetByExternalIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
        mockCreateIssue,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
        );

      mockGetByExternalIdRepository.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(pixFraudDetection);

      await expect(testScript).rejects.toThrow(
        PixFraudDetectionNotFoundException,
      );
      expect(mockGetByExternalIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateIssue).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw PixFraudDetectionInvalidStateException if state is invalid.', async () => {
      const {
        sut,
        mockGetByExternalIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
        mockCreateIssue,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            state: PixFraudDetectionState.CANCELED_REGISTERED_PENDING,
          },
        );

      mockGetByExternalIdRepository.mockResolvedValueOnce(pixFraudDetection);

      const testScript = () => sut.execute(pixFraudDetection);

      await expect(testScript).rejects.toThrow(
        PixFraudDetectionInvalidStateException,
      );
      expect(mockGetByExternalIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateIssue).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should execute pixFraudDetection successfully.', async () => {
      const {
        sut,
        mockGetByExternalIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
        mockCreateIssue,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            state: PixFraudDetectionState.RECEIVED_PENDING,
          },
        );

      mockGetByExternalIdRepository.mockResolvedValueOnce(pixFraudDetection);

      await sut.execute(pixFraudDetection);

      expect(mockGetByExternalIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockCreateIssue).toHaveBeenCalledTimes(1);
    });
  });
});
