import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  NotifyUserLimitRequestIssueEntity,
  NotifyUserLimitRequestIssueRepository,
} from '@zro/api-jira/domain';
import {
  HandleFailedNotifyUpdateUserLimitRequestIssueEventUseCase as UseCase,
  NotifyUserLimitRequestIssueEventEmitter,
} from '@zro/api-jira/application';
import { NotifyUserLimitRequestIssueFactory } from '@zro/test/api-jira/config';

describe('HandleFailedNotifyUpdateUserLimitRequestIssueEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      notifyUserLimitRequestIssueRepository,
      mockCreateNotifyUserLimitRequestIssueRepository,
    } = mockRepository();
    const {
      notifyUserLimitRequestIssueEmitter,
      mockErrorNotifyUserLimitRequestIssueEventEmitter,
    } = mockEventEmitter();

    const sut = new UseCase(
      logger,
      notifyUserLimitRequestIssueRepository,
      notifyUserLimitRequestIssueEmitter,
    );
    return {
      sut,
      mockCreateNotifyUserLimitRequestIssueRepository,
      mockErrorNotifyUserLimitRequestIssueEventEmitter,
    };
  };

  const mockRepository = () => {
    const notifyUserLimitRequestIssueRepository: NotifyUserLimitRequestIssueRepository =
      createMock<NotifyUserLimitRequestIssueRepository>();
    const mockCreateNotifyUserLimitRequestIssueRepository: jest.Mock = On(
      notifyUserLimitRequestIssueRepository,
    ).get(method((mock) => mock.create));

    return {
      notifyUserLimitRequestIssueRepository,
      mockCreateNotifyUserLimitRequestIssueRepository,
    };
  };

  const mockEventEmitter = () => {
    const notifyUserLimitRequestIssueEmitter: NotifyUserLimitRequestIssueEventEmitter =
      createMock<NotifyUserLimitRequestIssueEventEmitter>();
    const mockErrorNotifyUserLimitRequestIssueEventEmitter: jest.Mock = On(
      notifyUserLimitRequestIssueEmitter,
    ).get(method((mock) => mock.errorNotifyIssue));

    return {
      notifyUserLimitRequestIssueEmitter,
      mockErrorNotifyUserLimitRequestIssueEventEmitter,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle notify failed update issue and save in database', async () => {
      const {
        sut,
        mockErrorNotifyUserLimitRequestIssueEventEmitter,
        mockCreateNotifyUserLimitRequestIssueRepository,
      } = makeSut();
      const notifyUserLimitRequestIssueFactory =
        await NotifyUserLimitRequestIssueFactory.create<NotifyUserLimitRequestIssueEntity>(
          NotifyUserLimitRequestIssueEntity.name,
        );

      const notifyUserLimitRequestIssue = new NotifyUserLimitRequestIssueEntity(
        notifyUserLimitRequestIssueFactory,
      );

      await sut.execute(notifyUserLimitRequestIssue);

      expect(
        mockErrorNotifyUserLimitRequestIssueEventEmitter,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCreateNotifyUserLimitRequestIssueRepository,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
