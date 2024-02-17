import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  NotifyPixRefundIssueEntity,
  NotifyPixRefundIssueRepository,
} from '@zro/api-jira/domain';
import { NotifyPixRefundIssueFactory } from '@zro/test/api-jira/config';
import {
  HandleFailedNotifyUpdatePixRefundIssueEventUseCase as UseCase,
  NotifyPixRefundIssueEventEmitter,
} from '@zro/api-jira/application';

describe('HandleFailedNotifyUpdatePixRefundIssueEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      notifyPixRefundIssueRepository,
      mockCreateNotifyPixRefundIssueRepository,
    } = mockRepository();
    const {
      notifyPixRefundIssueEmitter,
      mockErrorNotifyPixRefundIssueEventEmitter,
    } = mockEventEmitter();

    const sut = new UseCase(
      logger,
      notifyPixRefundIssueRepository,
      notifyPixRefundIssueEmitter,
    );
    return {
      sut,
      mockCreateNotifyPixRefundIssueRepository,
      mockErrorNotifyPixRefundIssueEventEmitter,
    };
  };

  const mockRepository = () => {
    const notifyPixRefundIssueRepository: NotifyPixRefundIssueRepository =
      createMock<NotifyPixRefundIssueRepository>();
    const mockCreateNotifyPixRefundIssueRepository: jest.Mock = On(
      notifyPixRefundIssueRepository,
    ).get(method((mock) => mock.create));

    return {
      notifyPixRefundIssueRepository,
      mockCreateNotifyPixRefundIssueRepository,
    };
  };

  const mockEventEmitter = () => {
    const notifyPixRefundIssueEmitter: NotifyPixRefundIssueEventEmitter =
      createMock<NotifyPixRefundIssueEventEmitter>();
    const mockErrorNotifyPixRefundIssueEventEmitter: jest.Mock = On(
      notifyPixRefundIssueEmitter,
    ).get(method((mock) => mock.errorNotifyIssue));

    return {
      notifyPixRefundIssueEmitter,
      mockErrorNotifyPixRefundIssueEventEmitter,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle notify failed update issue and save in database', async () => {
      const {
        sut,
        mockErrorNotifyPixRefundIssueEventEmitter,
        mockCreateNotifyPixRefundIssueRepository,
      } = makeSut();
      const notifyPixRefundIssueFactory =
        await NotifyPixRefundIssueFactory.create<NotifyPixRefundIssueEntity>(
          NotifyPixRefundIssueEntity.name,
        );

      const notifyPixRefundIssue = new NotifyPixRefundIssueEntity(
        notifyPixRefundIssueFactory,
      );

      await sut.execute(notifyPixRefundIssue);

      expect(mockErrorNotifyPixRefundIssueEventEmitter).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreateNotifyPixRefundIssueRepository).toHaveBeenCalledTimes(1);
    });
  });
});
