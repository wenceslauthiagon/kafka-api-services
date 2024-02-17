import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  NotifyUserLimitRequestIssueEntity,
  NotifyUserLimitRequestIssueRepository,
} from '@zro/api-jira/domain';
import { UserLimitRequestStatus } from '@zro/compliance/domain';
import {
  HandleNotifyUpdateUserLimitRequestIssueEventUseCase as UseCase,
  ComplianceService,
} from '@zro/api-jira/application';
import { NotifyUserLimitRequestIssueFactory } from '@zro/test/api-jira/config';

describe('HandleNotifyUpdateUserLimitRequestIssueEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      notifyUserLimitRequestIssueRepository,
      mockUpdateNotifyUserLimitRequestIssueRepository,
    } = mockRepository();
    const { complianceService, mockCloseInfractionService } = mockService();

    const sut = new UseCase(
      logger,
      notifyUserLimitRequestIssueRepository,
      complianceService,
    );
    return {
      sut,
      mockUpdateNotifyUserLimitRequestIssueRepository,
      mockCloseInfractionService,
    };
  };

  const mockRepository = () => {
    const notifyUserLimitRequestIssueRepository: NotifyUserLimitRequestIssueRepository =
      createMock<NotifyUserLimitRequestIssueRepository>();
    const mockUpdateNotifyUserLimitRequestIssueRepository: jest.Mock = On(
      notifyUserLimitRequestIssueRepository,
    ).get(method((mock) => mock.create));

    return {
      notifyUserLimitRequestIssueRepository,
      mockUpdateNotifyUserLimitRequestIssueRepository,
    };
  };

  const mockService = () => {
    const complianceService: ComplianceService =
      createMock<ComplianceService>();

    const mockCloseInfractionService: jest.Mock = On(complianceService).get(
      method((mock) => mock.closeUserLimitRequest),
    );

    return {
      complianceService,
      mockCloseInfractionService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle update issue when issueId, infractionType, operationId, description or status not exists', async () => {
      const {
        sut,
        mockCloseInfractionService,
        mockUpdateNotifyUserLimitRequestIssueRepository,
      } = makeSut();

      const { issueId, userLimitRequestId, status, summary } =
        await NotifyUserLimitRequestIssueFactory.create<NotifyUserLimitRequestIssueEntity>(
          NotifyUserLimitRequestIssueEntity.name,
        );

      const test = [
        () =>
          sut.execute(
            new NotifyUserLimitRequestIssueEntity({
              issueId: null,
              userLimitRequestId,
              status,
              summary,
            }),
          ),
        sut.execute(
          new NotifyUserLimitRequestIssueEntity({
            issueId,
            userLimitRequestId: null,
            status,
            summary,
          }),
        ),
        sut.execute(
          new NotifyUserLimitRequestIssueEntity({
            issueId,
            userLimitRequestId,
            status: null,
            summary,
          }),
        ),
        sut.execute(
          new NotifyUserLimitRequestIssueEntity({
            issueId,
            userLimitRequestId,
            status,
            summary: null,
          }),
        ),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(mockCloseInfractionService).toHaveBeenCalledTimes(0);
      expect(
        mockUpdateNotifyUserLimitRequestIssueRepository,
      ).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should handle notify update issue and save in database', async () => {
      const {
        sut,
        mockCloseInfractionService,
        mockUpdateNotifyUserLimitRequestIssueRepository,
      } = makeSut();
      const notifyUserLimitRequestIssueFactory =
        await NotifyUserLimitRequestIssueFactory.create<NotifyUserLimitRequestIssueEntity>(
          NotifyUserLimitRequestIssueEntity.name,
        );

      const notifyUserLimitRequestIssue = new NotifyUserLimitRequestIssueEntity(
        notifyUserLimitRequestIssueFactory,
      );

      await sut.execute({
        ...notifyUserLimitRequestIssue,
        status: UserLimitRequestStatus.CLOSED,
      });

      expect(mockCloseInfractionService).toHaveBeenCalledTimes(1);
      expect(
        mockUpdateNotifyUserLimitRequestIssueRepository,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
