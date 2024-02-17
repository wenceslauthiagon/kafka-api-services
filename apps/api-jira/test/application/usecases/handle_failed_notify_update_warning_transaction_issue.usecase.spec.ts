import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  HandleFailedNotifyUpdateWarningTransactionIssueEventUseCase as UseCase,
  NotifyWarningTransactionIssueEventEmitter,
} from '@zro/api-jira/application';
import {
  NotifyWarningTransactionIssueEntity,
  NotifyWarningTransactionIssueRepository,
} from '@zro/api-jira/domain';
import { NotifyWarningTransactionIssueFactory } from '@zro/test/api-jira/config';

describe('HandleFailedNotifyUpdateWarningTransactionIssueEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      notifyWarningTransactionIssueRepository,
      mockCreateNotifyWarningTransactionIssueRepository,
    } = mockRepository();
    const {
      notifyWarningTransactionIssueEmitter,
      mockErrorNotifyWarningTransactionIssueEventEmitter,
    } = mockEventEmitter();

    const sut = new UseCase(
      logger,
      notifyWarningTransactionIssueRepository,
      notifyWarningTransactionIssueEmitter,
    );
    return {
      sut,
      mockCreateNotifyWarningTransactionIssueRepository,
      mockErrorNotifyWarningTransactionIssueEventEmitter,
    };
  };

  const mockRepository = () => {
    const notifyWarningTransactionIssueRepository: NotifyWarningTransactionIssueRepository =
      createMock<NotifyWarningTransactionIssueRepository>();
    const mockCreateNotifyWarningTransactionIssueRepository: jest.Mock = On(
      notifyWarningTransactionIssueRepository,
    ).get(method((mock) => mock.create));

    return {
      notifyWarningTransactionIssueRepository,
      mockCreateNotifyWarningTransactionIssueRepository,
    };
  };

  const mockEventEmitter = () => {
    const notifyWarningTransactionIssueEmitter: NotifyWarningTransactionIssueEventEmitter =
      createMock<NotifyWarningTransactionIssueEventEmitter>();
    const mockErrorNotifyWarningTransactionIssueEventEmitter: jest.Mock = On(
      notifyWarningTransactionIssueEmitter,
    ).get(method((mock) => mock.errorNotifyIssue));

    return {
      notifyWarningTransactionIssueEmitter,
      mockErrorNotifyWarningTransactionIssueEventEmitter,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle notify failed update issue and save in database', async () => {
      const {
        sut,
        mockErrorNotifyWarningTransactionIssueEventEmitter,
        mockCreateNotifyWarningTransactionIssueRepository,
      } = makeSut();
      const notifyWarningTransactionIssue =
        await NotifyWarningTransactionIssueFactory.create<NotifyWarningTransactionIssueEntity>(
          NotifyWarningTransactionIssueEntity.name,
        );

      await sut.execute(notifyWarningTransactionIssue);

      expect(
        mockErrorNotifyWarningTransactionIssueEventEmitter,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCreateNotifyWarningTransactionIssueRepository,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
