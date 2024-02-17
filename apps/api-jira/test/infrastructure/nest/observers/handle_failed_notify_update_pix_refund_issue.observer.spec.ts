import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { NotifyPixRefundIssueRepository } from '@zro/api-jira/domain';
import { AppModule } from '@zro/api-jira/infrastructure/nest/modules/app.module';
import {
  NotifyUpdatePixRefundIssueNestObserver,
  NotifyPixRefundIssueDatabaseRepository,
  NotifyPixRefundIssueModel,
} from '@zro/api-jira/infrastructure';
import {
  HandleNotifyUpdatePixRefundIssueEventRequest,
  NotifyPixRefundIssueEventEmitterControllerInterface,
  NotifyPixRefundIssueEventType,
} from '@zro/api-jira/interface';
import { NotifyPixRefundIssueFactory } from '@zro/test/api-jira/config';

describe('NotifyUpdatePixRefundIssueNestObserver', () => {
  let module: TestingModule;
  let controller: NotifyUpdatePixRefundIssueNestObserver;
  let notifyIssueRepository: NotifyPixRefundIssueRepository;

  const notifyIssueEmitter: NotifyPixRefundIssueEventEmitterControllerInterface =
    createMock<NotifyPixRefundIssueEventEmitterControllerInterface>();
  const mockEmitNotifyPixRefundIssueEvent: jest.Mock = On(
    notifyIssueEmitter,
  ).get(method((mock) => mock.emitIssueEvent));

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<NotifyUpdatePixRefundIssueNestObserver>(
      NotifyUpdatePixRefundIssueNestObserver,
    );
    notifyIssueRepository = new NotifyPixRefundIssueDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleNotifyUpdatePixRefundIssueDeadLetterEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle failed create issue successfully', async () => {
        const data =
          await NotifyPixRefundIssueFactory.create<NotifyPixRefundIssueModel>(
            NotifyPixRefundIssueModel.name,
          );
        const message: HandleNotifyUpdatePixRefundIssueEventRequest = {
          issueId: data.issueId,
          reason: data.reason,
          status: data.status,
          operationId: data.operationId,
          description: data.description,
          summary: data.summary,
          issueCreatedAt: data.issueCreatedAt,
        };

        const spyUpdate = jest.spyOn(notifyIssueRepository, 'create');

        await controller.handleNotifyUpdatePixRefundIssueDeadLetterEvent(
          message,
          logger,
          notifyIssueRepository,
          notifyIssueEmitter,
        );

        expect(spyUpdate).toHaveBeenCalledTimes(1);
        expect(mockEmitNotifyPixRefundIssueEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitNotifyPixRefundIssueEvent.mock.calls[0][0]).toBe(
          NotifyPixRefundIssueEventType.ERROR,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
