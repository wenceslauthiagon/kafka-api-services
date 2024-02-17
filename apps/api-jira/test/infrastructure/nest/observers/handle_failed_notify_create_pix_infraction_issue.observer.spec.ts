import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { NotifyPixInfractionIssueRepository } from '@zro/api-jira/domain';
import { AppModule } from '@zro/api-jira/infrastructure/nest/modules/app.module';
import {
  NotifyCreatePixInfractionIssueNestObserver,
  NotifyPixInfractionIssueDatabaseRepository,
  NotifyPixInfractionIssueModel,
} from '@zro/api-jira/infrastructure';
import {
  HandleNotifyCreatePixInfractionIssueEventRequest,
  NotifyPixInfractionIssueEventEmitterControllerInterface,
  NotifyPixInfractionIssueEventType,
} from '@zro/api-jira/interface';
import { NotifyPixInfractionIssueFactory } from '@zro/test/api-jira/config';

describe('NotifyCreatePixInfractionIssueNestObserver', () => {
  let module: TestingModule;
  let controller: NotifyCreatePixInfractionIssueNestObserver;
  let notifyIssueRepository: NotifyPixInfractionIssueRepository;

  const notifyIssueEmitter: NotifyPixInfractionIssueEventEmitterControllerInterface =
    createMock<NotifyPixInfractionIssueEventEmitterControllerInterface>();
  const mockEmitNotifyPixInfractionIssueEvent: jest.Mock = On(
    notifyIssueEmitter,
  ).get(method((mock) => mock.emitIssueEvent));

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<NotifyCreatePixInfractionIssueNestObserver>(
      NotifyCreatePixInfractionIssueNestObserver,
    );
    notifyIssueRepository = new NotifyPixInfractionIssueDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleNotifyCreatePixInfractionIssueDeadLetterEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle failed create issue successfully', async () => {
        const data =
          await NotifyPixInfractionIssueFactory.create<NotifyPixInfractionIssueModel>(
            NotifyPixInfractionIssueModel.name,
          );
        const message: HandleNotifyCreatePixInfractionIssueEventRequest = {
          issueId: data.issueId,
          status: data.status,
          operationId: data.operationId,
          description: data.description,
          infractionType: data.infractionType,
          summary: data.summary,
          issueCreatedAt: new Date(),
        };

        const spyCreate = jest.spyOn(notifyIssueRepository, 'create');

        await controller.handleNotifyCreatePixInfractionIssueDeadLetterEvent(
          message,
          logger,
          notifyIssueRepository,
          notifyIssueEmitter,
        );

        expect(spyCreate).toHaveBeenCalledTimes(1);
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
