import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  NotifyPixInfractionIssueEntity,
  NotifyPixInfractionIssueRepository,
} from '@zro/api-jira/domain';
import {
  HandleFailedNotifyUpdatePixInfractionIssueEventUseCase as UseCase,
  NotifyPixInfractionIssueEventEmitter,
} from '@zro/api-jira/application';
import { NotifyPixInfractionIssueFactory } from '@zro/test/api-jira/config';

describe('HandleFailedNotifyUpdatePixInfractionIssueEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      notifyPixInfractionIssueRepository,
      mockCreateNotifyPixInfractionIssueRepository,
    } = mockRepository();
    const {
      notifyPixInfractionIssueEmitter,
      mockErrorNotifyPixInfractionIssueEventEmitter,
    } = mockEventEmitter();

    const sut = new UseCase(
      logger,
      notifyPixInfractionIssueRepository,
      notifyPixInfractionIssueEmitter,
    );
    return {
      sut,
      mockCreateNotifyPixInfractionIssueRepository,
      mockErrorNotifyPixInfractionIssueEventEmitter,
    };
  };

  const mockRepository = () => {
    const notifyPixInfractionIssueRepository: NotifyPixInfractionIssueRepository =
      createMock<NotifyPixInfractionIssueRepository>();
    const mockCreateNotifyPixInfractionIssueRepository: jest.Mock = On(
      notifyPixInfractionIssueRepository,
    ).get(method((mock) => mock.create));

    return {
      notifyPixInfractionIssueRepository,
      mockCreateNotifyPixInfractionIssueRepository,
    };
  };

  const mockEventEmitter = () => {
    const notifyPixInfractionIssueEmitter: NotifyPixInfractionIssueEventEmitter =
      createMock<NotifyPixInfractionIssueEventEmitter>();
    const mockErrorNotifyPixInfractionIssueEventEmitter: jest.Mock = On(
      notifyPixInfractionIssueEmitter,
    ).get(method((mock) => mock.errorNotifyIssue));

    return {
      notifyPixInfractionIssueEmitter,
      mockErrorNotifyPixInfractionIssueEventEmitter,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle notify failed update issue and save in database', async () => {
      const {
        sut,
        mockErrorNotifyPixInfractionIssueEventEmitter,
        mockCreateNotifyPixInfractionIssueRepository,
      } = makeSut();
      const notifyPixInfractionIssueFactory =
        await NotifyPixInfractionIssueFactory.create<NotifyPixInfractionIssueEntity>(
          NotifyPixInfractionIssueEntity.name,
        );

      const notifyPixInfractionIssue = new NotifyPixInfractionIssueEntity(
        notifyPixInfractionIssueFactory,
      );

      await sut.execute(notifyPixInfractionIssue);

      expect(
        mockErrorNotifyPixInfractionIssueEventEmitter,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCreateNotifyPixInfractionIssueRepository,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
