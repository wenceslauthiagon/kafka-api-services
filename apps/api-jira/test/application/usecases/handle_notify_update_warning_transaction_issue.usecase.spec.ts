import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  HandleNotifyUpdateWarningTransactionIssueEventUseCase as UseCase,
  ComplianceService,
} from '@zro/api-jira/application';
import {
  NotifyWarningTransactionIssueEntity,
  NotifyWarningTransactionIssueRepository,
} from '@zro/api-jira/domain';
import { NotifyWarningTransactionIssueFactory } from '@zro/test/api-jira/config';
import {
  WarningTransactionAnalysisResultType,
  WarningTransactionStatus,
} from '@zro/compliance/domain';

describe('HandleNotifyUpdateWarningTransactionIssueEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const notifyIssueRepository: NotifyWarningTransactionIssueRepository =
      createMock<NotifyWarningTransactionIssueRepository>();

    const mockCreateIssueRepository: jest.Mock = On(notifyIssueRepository).get(
      method((mock) => mock.create),
    );

    const mockGetByIssueIdAndStatus: jest.Mock = On(notifyIssueRepository).get(
      method((mock) => mock.getByIssueIdAndStatus),
    );

    const complianceService: ComplianceService =
      createMock<ComplianceService>();

    const mockCloseWarningTransaction: jest.Mock = On(complianceService).get(
      method((mock) => mock.closeWarningTransaction),
    );

    const sut = new UseCase(logger, notifyIssueRepository, complianceService);

    return {
      sut,
      mockCreateIssueRepository,
      mockGetByIssueIdAndStatus,
      mockCloseWarningTransaction,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle update issue when missing params', async () => {
      const {
        sut,
        mockCreateIssueRepository,
        mockGetByIssueIdAndStatus,
        mockCloseWarningTransaction,
      } = makeSut();

      const { issueId, operationId, status, summary, analysisResult } =
        await NotifyWarningTransactionIssueFactory.create<NotifyWarningTransactionIssueEntity>(
          NotifyWarningTransactionIssueEntity.name,
          {
            analysisResult: WarningTransactionAnalysisResultType.APPROVED,
          },
        );

      const test = [
        () =>
          sut.execute(
            new NotifyWarningTransactionIssueEntity({
              issueId: null,
              operationId,
              status,
              summary,
              analysisResult,
            }),
          ),
        sut.execute(
          new NotifyWarningTransactionIssueEntity({
            issueId,
            operationId: null,
            status,
            summary,
            analysisResult,
          }),
        ),
        sut.execute(
          new NotifyWarningTransactionIssueEntity({
            issueId,
            operationId,
            status: null,
            summary,
            analysisResult,
          }),
        ),
        sut.execute(
          new NotifyWarningTransactionIssueEntity({
            issueId,
            operationId,
            status,
            summary: null,
            analysisResult,
          }),
        ),
        sut.execute(
          new NotifyWarningTransactionIssueEntity({
            issueId,
            operationId,
            status,
            summary,
            analysisResult: null,
          }),
        ),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(mockCreateIssueRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIssueIdAndStatus).toHaveBeenCalledTimes(0);
      expect(mockCloseWarningTransaction).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should return if notifyWarningTransactionIssue already exists', async () => {
      const {
        sut,
        mockCreateIssueRepository,
        mockGetByIssueIdAndStatus,
        mockCloseWarningTransaction,
      } = makeSut();

      const notifyWarningTransactionIssue =
        await NotifyWarningTransactionIssueFactory.create<NotifyWarningTransactionIssueEntity>(
          NotifyWarningTransactionIssueEntity.name,
          {
            analysisResult: WarningTransactionAnalysisResultType.APPROVED,
          },
        );

      mockGetByIssueIdAndStatus.mockResolvedValue(
        notifyWarningTransactionIssue,
      );

      await sut.execute({
        ...notifyWarningTransactionIssue,
        status: WarningTransactionStatus.CLOSED,
      });

      expect(mockCreateIssueRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIssueIdAndStatus).toHaveBeenCalledTimes(1);
      expect(mockCloseWarningTransaction).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should handle notify update issue and save in database', async () => {
      const {
        sut,
        mockCreateIssueRepository,
        mockGetByIssueIdAndStatus,
        mockCloseWarningTransaction,
      } = makeSut();

      const notifyWarningTransactionIssue =
        await NotifyWarningTransactionIssueFactory.create<NotifyWarningTransactionIssueEntity>(
          NotifyWarningTransactionIssueEntity.name,
          {
            analysisResult: WarningTransactionAnalysisResultType.APPROVED,
            analysisDetails: 'Pix bloqueado por motivos de teste.',
          },
        );

      mockGetByIssueIdAndStatus.mockResolvedValue(null);

      await sut.execute({
        ...notifyWarningTransactionIssue,
        status: WarningTransactionStatus.CLOSED,
      });

      expect(mockCreateIssueRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIssueIdAndStatus).toHaveBeenCalledTimes(1);
      expect(mockCloseWarningTransaction).toHaveBeenCalledTimes(1);
    });
  });
});
