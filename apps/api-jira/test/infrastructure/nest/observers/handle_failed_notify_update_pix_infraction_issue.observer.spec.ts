import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { NotifyPixInfractionIssueRepository } from '@zro/api-jira/domain';
import { AppModule } from '@zro/api-jira/infrastructure/nest/modules/app.module';
import {
  NotifyUpdatePixInfractionIssueNestObserver,
  NotifyPixInfractionIssueDatabaseRepository,
  NotifyPixInfractionIssueModel,
} from '@zro/api-jira/infrastructure';
import {
  HandleNotifyUpdatePixInfractionIssueEventRequest,
  NotifyPixInfractionIssueEventEmitterControllerInterface,
  NotifyPixInfractionIssueEventType,
} from '@zro/api-jira/interface';
import { NotifyPixInfractionIssueFactory } from '@zro/test/api-jira/config';

describe('NotifyUpdatePixInfractionIssueNestObserver', () => {
  let module: TestingModule;
  let controller: NotifyUpdatePixInfractionIssueNestObserver;
  let notifyIssueRepository: NotifyPixInfractionIssueRepository;

  const notifyIssueEmitter: NotifyPixInfractionIssueEventEmitterControllerInterface =
    createMock<NotifyPixInfractionIssueEventEmitterControllerInterface>();
  const mockEmitNotifyPixInfractionIssueEvent: jest.Mock = On(
    notifyIssueEmitter,
  ).get(method((mock) => mock.emitIssueEvent));

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<NotifyUpdatePixInfractionIssueNestObserver>(
      NotifyUpdatePixInfractionIssueNestObserver,
    );
    notifyIssueRepository = new NotifyPixInfractionIssueDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleNotifyUpdatePixInfractionIssueDeadLetterEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle failed create issue successfully', async () => {
        const data =
          await NotifyPixInfractionIssueFactory.create<NotifyPixInfractionIssueModel>(
            NotifyPixInfractionIssueModel.name,
          );
        const message: HandleNotifyUpdatePixInfractionIssueEventRequest = {
          issueId: data.issueId,
          infractionType: data.infractionType,
          status: data.status,
          operationId: data.operationId,
          description: data.description,
          summary: data.summary,
          issueCreatedAt: data.issueCreatedAt,
        };
        const spyUpdate = jest.spyOn(notifyIssueRepository, 'create');

        await controller.handleNotifyUpdatePixInfractionIssueDeadLetterEvent(
          message,
          logger,
          notifyIssueRepository,
          notifyIssueEmitter,
        );

        expect(spyUpdate).toHaveBeenCalledTimes(1);
        expect(mockEmitNotifyPixInfractionIssueEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitNotifyPixInfractionIssueEvent.mock.calls[0][0]).toBe(
          NotifyPixInfractionIssueEventType.ERROR,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
