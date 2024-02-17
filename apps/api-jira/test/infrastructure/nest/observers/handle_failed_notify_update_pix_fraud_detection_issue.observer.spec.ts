import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { NotifyPixFraudDetectionIssueRepository } from '@zro/api-jira/domain';
import { AppModule } from '@zro/api-jira/infrastructure/nest/modules/app.module';
import {
  NotifyUpdatePixFraudDetectionIssueNestObserver,
  NotifyPixFraudDetectionIssueDatabaseRepository,
  NotifyPixFraudDetectionIssueModel,
} from '@zro/api-jira/infrastructure';
import {
  HandleNotifyUpdatePixFraudDetectionIssueEventRequest,
  NotifyPixFraudDetectionIssueEventEmitterControllerInterface,
  NotifyPixFraudDetectionIssueEventType,
} from '@zro/api-jira/interface';
import { NotifyPixFraudDetectionIssueFactory } from '@zro/test/api-jira/config';

describe('NotifyUpdatePixFraudDetectionIssueNestObserver', () => {
  let module: TestingModule;
  let controller: NotifyUpdatePixFraudDetectionIssueNestObserver;
  let notifyIssueRepository: NotifyPixFraudDetectionIssueRepository;

  const notifyIssueEmitter: NotifyPixFraudDetectionIssueEventEmitterControllerInterface =
    createMock<NotifyPixFraudDetectionIssueEventEmitterControllerInterface>();
  const mockEmitNotifyPixFraudDetectionIssueEvent: jest.Mock = On(
    notifyIssueEmitter,
  ).get(method((mock) => mock.emitIssueEvent));

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<NotifyUpdatePixFraudDetectionIssueNestObserver>(
      NotifyUpdatePixFraudDetectionIssueNestObserver,
    );
    notifyIssueRepository =
      new NotifyPixFraudDetectionIssueDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleNotifyUpdatePixFraudDetectionIssueDeadLetterEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle failed create issue successfully', async () => {
        const data =
          await NotifyPixFraudDetectionIssueFactory.create<NotifyPixFraudDetectionIssueModel>(
            NotifyPixFraudDetectionIssueModel.name,
          );
        const message: HandleNotifyUpdatePixFraudDetectionIssueEventRequest = {
          issueId: data.issueId,
          issueTypeId: data.issueTypeId,
          projectId: data.projectId,
          projectKey: data.projectKey,
          projectName: data.projectName,
          priorityId: data.priorityId,
          priorityName: data.priorityName,
          statusId: data.statusId,
          status: data.status,
          summary: data.summary,
          assigneeName: data.assigneeName,
          creatorName: data.creatorName,
          reporterName: data.reporterName,
          issueCreatedAt: data.issueCreatedAt,
          document: data.document,
          fraudType: data.fraudType,
          key: data.key,
        };
        const spyUpdate = jest.spyOn(notifyIssueRepository, 'create');

        await controller.handleNotifyUpdatePixFraudDetectionIssueDeadLetterEvent(
          message,
          logger,
          notifyIssueRepository,
          notifyIssueEmitter,
        );

        expect(spyUpdate).toHaveBeenCalledTimes(1);
        expect(mockEmitNotifyPixFraudDetectionIssueEvent).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEmitNotifyPixFraudDetectionIssueEvent.mock.calls[0][0]).toBe(
          NotifyPixFraudDetectionIssueEventType.ERROR,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
