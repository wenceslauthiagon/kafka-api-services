import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  NotifyPixFraudDetectionIssueEntity,
  NotifyPixFraudDetectionIssueRepository,
} from '@zro/api-jira/domain';
import {
  HandleNotifyUpdatePixFraudDetectionIssueEventUseCase as UseCase,
  PixPaymentService,
} from '@zro/api-jira/application';
import { NotifyPixFraudDetectionIssueFactory } from '@zro/test/api-jira/config';

describe('HandleNotifyUpdatePixFraudDetectionIssueEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      notifyPixFraudDetectionIssueRepository,
      mockUpdateNotifyPixFraudDetectionIssueRepository,
      mockGetNotifyPixFraudDetectionIssueRepository,
    } = mockRepository();
    const {
      pixPaymentService,
      mockRegisterFraudDetectionService,
      mockCancelFraudDetectionService,
    } = mockService();

    const sut = new UseCase(
      logger,
      notifyPixFraudDetectionIssueRepository,
      pixPaymentService,
    );
    return {
      sut,
      mockUpdateNotifyPixFraudDetectionIssueRepository,
      mockRegisterFraudDetectionService,
      mockCancelFraudDetectionService,
      mockGetNotifyPixFraudDetectionIssueRepository,
    };
  };

  const mockRepository = () => {
    const notifyPixFraudDetectionIssueRepository: NotifyPixFraudDetectionIssueRepository =
      createMock<NotifyPixFraudDetectionIssueRepository>();
    const mockUpdateNotifyPixFraudDetectionIssueRepository: jest.Mock = On(
      notifyPixFraudDetectionIssueRepository,
    ).get(method((mock) => mock.create));

    const mockGetNotifyPixFraudDetectionIssueRepository: jest.Mock = On(
      notifyPixFraudDetectionIssueRepository,
    ).get(method((mock) => mock.getByIssueIdAndStatus));

    return {
      notifyPixFraudDetectionIssueRepository,
      mockUpdateNotifyPixFraudDetectionIssueRepository,
      mockGetNotifyPixFraudDetectionIssueRepository,
    };
  };

  const mockService = () => {
    const pixPaymentService: PixPaymentService =
      createMock<PixPaymentService>();

    const mockRegisterFraudDetectionService: jest.Mock = On(
      pixPaymentService,
    ).get(method((mock) => mock.registerPixFraudDetection));

    const mockCancelFraudDetectionService: jest.Mock = On(
      pixPaymentService,
    ).get(method((mock) => mock.cancelRegisteredPixFraudDetection));

    return {
      pixPaymentService,
      mockRegisterFraudDetectionService,
      mockCancelFraudDetectionService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle update issue when issueId, document, fraudType, description or summary not exists', async () => {
      const {
        sut,
        mockRegisterFraudDetectionService,
        mockCancelFraudDetectionService,
        mockUpdateNotifyPixFraudDetectionIssueRepository,
      } = makeSut();

      const notify =
        await NotifyPixFraudDetectionIssueFactory.create<NotifyPixFraudDetectionIssueEntity>(
          NotifyPixFraudDetectionIssueEntity.name,
        );
      const { issueId, document, fraudType, summary, status } = notify;

      const test = [
        () =>
          sut.execute(
            new NotifyPixFraudDetectionIssueEntity({
              issueId: null,
              document,
              fraudType,
              summary,
              status,
            }),
          ),
        sut.execute(
          new NotifyPixFraudDetectionIssueEntity({
            issueId,
            document: null,
            fraudType,
            summary,
            status,
          }),
        ),
        sut.execute(
          new NotifyPixFraudDetectionIssueEntity({
            issueId,
            document,
            fraudType: null,
            summary,
            status,
          }),
        ),
        sut.execute(
          new NotifyPixFraudDetectionIssueEntity({
            issueId,
            document,
            fraudType,
            summary: null,
            status,
          }),
        ),
        sut.execute(
          new NotifyPixFraudDetectionIssueEntity({
            issueId,
            document,
            fraudType,
            summary,
            status: null,
          }),
        ),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(mockRegisterFraudDetectionService).toHaveBeenCalledTimes(0);
      expect(mockCancelFraudDetectionService).toHaveBeenCalledTimes(0);
      expect(
        mockUpdateNotifyPixFraudDetectionIssueRepository,
      ).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should handle notify update issue and save in database', async () => {
      const {
        sut,
        mockRegisterFraudDetectionService,
        mockCancelFraudDetectionService,
        mockUpdateNotifyPixFraudDetectionIssueRepository,
        mockGetNotifyPixFraudDetectionIssueRepository,
      } = makeSut();
      const notifyPixFraudDetectionIssueFactory =
        await NotifyPixFraudDetectionIssueFactory.create<NotifyPixFraudDetectionIssueEntity>(
          NotifyPixFraudDetectionIssueEntity.name,
        );

      const notifyPixFraudDetectionIssue =
        new NotifyPixFraudDetectionIssueEntity(
          notifyPixFraudDetectionIssueFactory,
        );

      mockGetNotifyPixFraudDetectionIssueRepository.mockResolvedValue(null);

      await sut.execute({
        ...notifyPixFraudDetectionIssue,
        summary: 'test',
      });

      expect(mockRegisterFraudDetectionService).toHaveBeenCalledTimes(1);
      expect(mockCancelFraudDetectionService).toHaveBeenCalledTimes(0);
      expect(
        mockUpdateNotifyPixFraudDetectionIssueRepository,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
