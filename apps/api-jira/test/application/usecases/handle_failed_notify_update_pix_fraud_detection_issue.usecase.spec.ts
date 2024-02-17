import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  NotifyPixFraudDetectionIssueEntity,
  NotifyPixFraudDetectionIssueRepository,
} from '@zro/api-jira/domain';
import {
  HandleFailedNotifyUpdatePixFraudDetectionIssueEventUseCase as UseCase,
  NotifyPixFraudDetectionIssueEventEmitter,
} from '@zro/api-jira/application';
import { NotifyPixFraudDetectionIssueFactory } from '@zro/test/api-jira/config';

describe('HandleFailedNotifyUpdatePixFraudDetectionIssueEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      notifyPixFraudDetectionIssueRepository,
      mockCreateNotifyPixFraudDetectionIssueRepository,
    } = mockRepository();
    const {
      notifyPixFraudDetectionIssueEmitter,
      mockErrorNotifyPixFraudDetectionIssueEventEmitter,
    } = mockEventEmitter();

    const sut = new UseCase(
      logger,
      notifyPixFraudDetectionIssueRepository,
      notifyPixFraudDetectionIssueEmitter,
    );
    return {
      sut,
      mockCreateNotifyPixFraudDetectionIssueRepository,
      mockErrorNotifyPixFraudDetectionIssueEventEmitter,
    };
  };

  const mockRepository = () => {
    const notifyPixFraudDetectionIssueRepository: NotifyPixFraudDetectionIssueRepository =
      createMock<NotifyPixFraudDetectionIssueRepository>();
    const mockCreateNotifyPixFraudDetectionIssueRepository: jest.Mock = On(
      notifyPixFraudDetectionIssueRepository,
    ).get(method((mock) => mock.create));

    return {
      notifyPixFraudDetectionIssueRepository,
      mockCreateNotifyPixFraudDetectionIssueRepository,
    };
  };

  const mockEventEmitter = () => {
    const notifyPixFraudDetectionIssueEmitter: NotifyPixFraudDetectionIssueEventEmitter =
      createMock<NotifyPixFraudDetectionIssueEventEmitter>();
    const mockErrorNotifyPixFraudDetectionIssueEventEmitter: jest.Mock = On(
      notifyPixFraudDetectionIssueEmitter,
    ).get(method((mock) => mock.errorNotifyIssue));

    return {
      notifyPixFraudDetectionIssueEmitter,
      mockErrorNotifyPixFraudDetectionIssueEventEmitter,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle notify failed update issue and save in database', async () => {
      const {
        sut,
        mockErrorNotifyPixFraudDetectionIssueEventEmitter,
        mockCreateNotifyPixFraudDetectionIssueRepository,
      } = makeSut();
      const notifyPixFraudDetectionIssueFactory =
        await NotifyPixFraudDetectionIssueFactory.create<NotifyPixFraudDetectionIssueEntity>(
          NotifyPixFraudDetectionIssueEntity.name,
        );

      const notifyPixFraudDetectionIssue =
        new NotifyPixFraudDetectionIssueEntity(
          notifyPixFraudDetectionIssueFactory,
        );

      await sut.execute(notifyPixFraudDetectionIssue);

      expect(
        mockErrorNotifyPixFraudDetectionIssueEventEmitter,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCreateNotifyPixFraudDetectionIssueRepository,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
