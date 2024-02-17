import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  HandleNotifyUpdateUserWithdrawSettingRequestIssueEventUseCase as UseCase,
  ComplianceService,
} from '@zro/api-jira/application';
import {
  NotifyUserWithdrawSettingRequestIssueEntity,
  NotifyUserWithdrawSettingRequestIssueRepository,
} from '@zro/api-jira/domain';
import { NotifyUserWithdrawSettingRequestIssueFactory } from '@zro/test/api-jira/config';
import {
  UserWithdrawSettingRequestAnalysisResultType,
  UserWithdrawSettingRequestState,
} from '@zro/compliance/domain';

describe('HandleNotifyUpdateUserWithdrawSettingRequestIssueEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const notifyIssueRepository: NotifyUserWithdrawSettingRequestIssueRepository =
      createMock<NotifyUserWithdrawSettingRequestIssueRepository>();

    const mockCreateIssueRepository: jest.Mock = On(notifyIssueRepository).get(
      method((mock) => mock.create),
    );

    const mockGetByIssueIdAndStatus: jest.Mock = On(notifyIssueRepository).get(
      method((mock) => mock.getByIssueIdAndStatus),
    );

    const complianceService: ComplianceService =
      createMock<ComplianceService>();

    const mockCloseUserWithdrawSettingRequest: jest.Mock = On(
      complianceService,
    ).get(method((mock) => mock.closeUserWithdrawSettingRequest));

    const sut = new UseCase(logger, notifyIssueRepository, complianceService);

    return {
      sut,
      mockCreateIssueRepository,
      mockGetByIssueIdAndStatus,
      mockCloseUserWithdrawSettingRequest,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle update issue when missing params', async () => {
      const {
        sut,
        mockCreateIssueRepository,
        mockGetByIssueIdAndStatus,
        mockCloseUserWithdrawSettingRequest,
      } = makeSut();

      const {
        issueId,
        userWithdrawSettingRequestId,
        status,
        summary,
        analysisResult,
      } =
        await NotifyUserWithdrawSettingRequestIssueFactory.create<NotifyUserWithdrawSettingRequestIssueEntity>(
          NotifyUserWithdrawSettingRequestIssueEntity.name,
          {
            analysisResult:
              UserWithdrawSettingRequestAnalysisResultType.APPROVED,
          },
        );

      const test = [
        () =>
          sut.execute(
            new NotifyUserWithdrawSettingRequestIssueEntity({
              issueId: null,
              userWithdrawSettingRequestId,
              status,
              summary,
              analysisResult,
            }),
          ),
        sut.execute(
          new NotifyUserWithdrawSettingRequestIssueEntity({
            issueId,
            userWithdrawSettingRequestId: null,
            status,
            summary,
            analysisResult,
          }),
        ),
        sut.execute(
          new NotifyUserWithdrawSettingRequestIssueEntity({
            issueId,
            userWithdrawSettingRequestId,
            status: null,
            summary,
            analysisResult,
          }),
        ),
        sut.execute(
          new NotifyUserWithdrawSettingRequestIssueEntity({
            issueId,
            userWithdrawSettingRequestId,
            status,
            summary: null,
            analysisResult,
          }),
        ),
        sut.execute(
          new NotifyUserWithdrawSettingRequestIssueEntity({
            issueId,
            userWithdrawSettingRequestId,
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
      expect(mockCloseUserWithdrawSettingRequest).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should return if notifyUserWithdrawSettingRequestIssue already exists', async () => {
      const {
        sut,
        mockCreateIssueRepository,
        mockGetByIssueIdAndStatus,
        mockCloseUserWithdrawSettingRequest,
      } = makeSut();

      const notifyUserWithdrawSettingRequestIssue =
        await NotifyUserWithdrawSettingRequestIssueFactory.create<NotifyUserWithdrawSettingRequestIssueEntity>(
          NotifyUserWithdrawSettingRequestIssueEntity.name,
          {
            analysisResult:
              UserWithdrawSettingRequestAnalysisResultType.APPROVED,
          },
        );

      mockGetByIssueIdAndStatus.mockResolvedValue(
        notifyUserWithdrawSettingRequestIssue,
      );

      await sut.execute({
        ...notifyUserWithdrawSettingRequestIssue,
        status: UserWithdrawSettingRequestState.CLOSED,
      });

      expect(mockCreateIssueRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIssueIdAndStatus).toHaveBeenCalledTimes(1);
      expect(mockCloseUserWithdrawSettingRequest).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should handle notify update issue and save in database', async () => {
      const {
        sut,
        mockCreateIssueRepository,
        mockGetByIssueIdAndStatus,
        mockCloseUserWithdrawSettingRequest,
      } = makeSut();

      const notifyUserWithdrawSettingRequestIssue =
        await NotifyUserWithdrawSettingRequestIssueFactory.create<NotifyUserWithdrawSettingRequestIssueEntity>(
          NotifyUserWithdrawSettingRequestIssueEntity.name,
          {
            analysisResult:
              UserWithdrawSettingRequestAnalysisResultType.APPROVED,
          },
        );

      mockGetByIssueIdAndStatus.mockResolvedValue(null);

      await sut.execute({
        ...notifyUserWithdrawSettingRequestIssue,
        status: UserWithdrawSettingRequestState.CLOSED,
      });

      expect(mockCreateIssueRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIssueIdAndStatus).toHaveBeenCalledTimes(1);
      expect(mockCloseUserWithdrawSettingRequest).toHaveBeenCalledTimes(1);
    });
  });
});
