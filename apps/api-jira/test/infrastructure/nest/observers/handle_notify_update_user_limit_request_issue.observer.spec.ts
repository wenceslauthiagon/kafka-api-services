import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { NotifyUserLimitRequestIssueRepository } from '@zro/api-jira/domain';
import { AppModule } from '@zro/api-jira/infrastructure/nest/modules/app.module';
import {
  NotifyUpdateUserLimitRequestIssueNestObserver,
  NotifyUserLimitRequestIssueDatabaseRepository,
  NotifyUserLimitRequestIssueModel,
} from '@zro/api-jira/infrastructure';
import {
  HandleNotifyUpdateUserLimitRequestIssueEventRequest,
  NotifyUserLimitRequestIssueEventEmitterControllerInterface,
  NotifyUserLimitRequestIssueEventType,
} from '@zro/api-jira/interface';
import { NotifyUserLimitRequestIssueFactory } from '@zro/test/api-jira/config';

describe('NotifyUpdateUserLimitRequestIssueNestObserver', () => {
  let module: TestingModule;
  let controller: NotifyUpdateUserLimitRequestIssueNestObserver;
  let notifyIssueRepository: NotifyUserLimitRequestIssueRepository;

  const notifyIssueEmitter: NotifyUserLimitRequestIssueEventEmitterControllerInterface =
    createMock<NotifyUserLimitRequestIssueEventEmitterControllerInterface>();
  const mockEmitNotifyUserLimitRequestIssueEvent: jest.Mock = On(
    notifyIssueEmitter,
  ).get(method((mock) => mock.emitIssueEvent));

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<NotifyUpdateUserLimitRequestIssueNestObserver>(
      NotifyUpdateUserLimitRequestIssueNestObserver,
    );
    notifyIssueRepository = new NotifyUserLimitRequestIssueDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleNotifyUpdateUserLimitRequestIssueDeadLetterEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle failed create issue successfully', async () => {
        const data =
          await NotifyUserLimitRequestIssueFactory.create<NotifyUserLimitRequestIssueModel>(
            NotifyUserLimitRequestIssueModel.name,
          );
        const message: HandleNotifyUpdateUserLimitRequestIssueEventRequest = {
          issueId: data.issueId,
          status: data.status,
          userLimitRequestId: data.userLimitRequestId,
          summary: data.summary,
          issueCreatedAt: new Date(),
        };

        const spyUpdate = jest.spyOn(notifyIssueRepository, 'create');

        await controller.handleNotifyUpdateUserLimitRequestIssueDeadLetterEvent(
          message,
          logger,
          notifyIssueRepository,
          notifyIssueEmitter,
        );

        expect(spyUpdate).toHaveBeenCalledTimes(1);
        expect(mockEmitNotifyUserLimitRequestIssueEvent).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEmitNotifyUserLimitRequestIssueEvent.mock.calls[0][0]).toBe(
          NotifyUserLimitRequestIssueEventType.ERROR,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
