import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger } from '@zro/common';
import {
  WarningTransactionAnalysisResultType,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import { NotifyWarningTransactionIssueRepository } from '@zro/api-jira/domain';
import { AppModule } from '@zro/api-jira/infrastructure/nest/modules/app.module';
import {
  NotifyUpdateWarningTransactionIssueNestObserver,
  NotifyWarningTransactionIssueDatabaseRepository,
  NotifyWarningTransactionIssueModel,
  ComplianceServiceKafka,
} from '@zro/api-jira/infrastructure';
import {
  HandleNotifyUpdateWarningTransactionIssueEventRequest,
  NotifyWarningTransactionIssueEventEmitterControllerInterface,
  NotifyWarningTransactionIssueEventType,
} from '@zro/api-jira/interface';
import { NotifyWarningTransactionIssueFactory } from '@zro/test/api-jira/config';

describe('NotifyUpdateWarningTransactionIssueNestObserver', () => {
  let module: TestingModule;
  let controller: NotifyUpdateWarningTransactionIssueNestObserver;
  let notifyIssueRepository: NotifyWarningTransactionIssueRepository;

  const notifyIssueEmitter: NotifyWarningTransactionIssueEventEmitterControllerInterface =
    createMock<NotifyWarningTransactionIssueEventEmitterControllerInterface>();
  const mockEmitNotifyWarningTransactionIssueEvent: jest.Mock = On(
    notifyIssueEmitter,
  ).get(method((mock) => mock.emitIssueEvent));

  const complianceService: ComplianceServiceKafka =
    createMock<ComplianceServiceKafka>();
  const mockCloseWarningTransaction: jest.Mock = On(complianceService).get(
    method((mock) => mock.closeWarningTransaction),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<NotifyUpdateWarningTransactionIssueNestObserver>(
      NotifyUpdateWarningTransactionIssueNestObserver,
    );
    notifyIssueRepository =
      new NotifyWarningTransactionIssueDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('handleNotifyUpdateWarningTransactionIssueDeadLetterEvent', () => {
    it('TC0001 - Should handle failed issue successfully', async () => {
      const data =
        await NotifyWarningTransactionIssueFactory.create<NotifyWarningTransactionIssueModel>(
          NotifyWarningTransactionIssueModel.name,
        );
      const message: HandleNotifyUpdateWarningTransactionIssueEventRequest = {
        issueId: data.issueId,
        status: data.status,
        operationId: data.operationId,
        summary: data.summary,
        issueCreatedAt: new Date(),
      };

      const spyUpdate = jest.spyOn(notifyIssueRepository, 'create');

      await controller.handleNotifyUpdateWarningTransactionIssueDeadLetterEvent(
        message,
        logger,
        notifyIssueRepository,
        notifyIssueEmitter,
      );

      expect(spyUpdate).toHaveBeenCalledTimes(1);
      expect(mockEmitNotifyWarningTransactionIssueEvent).toHaveBeenCalledTimes(
        1,
      );
      expect(mockEmitNotifyWarningTransactionIssueEvent.mock.calls[0][0]).toBe(
        NotifyWarningTransactionIssueEventType.ERROR,
      );
    });
  });

  describe('handleNotifyUpdateWarningTransactionIssueEventViaPixPayment', () => {
    it('TC0002 - Should handle created issue successfully', async () => {
      const data =
        await NotifyWarningTransactionIssueFactory.create<NotifyWarningTransactionIssueModel>(
          NotifyWarningTransactionIssueModel.name,
          { status: WarningTransactionStatus.CLOSED },
        );
      const message: HandleNotifyUpdateWarningTransactionIssueEventRequest = {
        issueId: faker.datatype.number({ min: 1, max: 99999 }),
        status: data.status,
        operationId: data.operationId,
        summary: data.summary,
        issueCreatedAt: new Date(),
        analysisResult: WarningTransactionAnalysisResultType.REJECTED,
      };
      const spyUpdate = jest.spyOn(notifyIssueRepository, 'create');

      await controller.handleNotifyUpdateWarningTransactionIssueEventViaPixPayment(
        message,
        logger,
        notifyIssueRepository,
        complianceService,
        ctx,
      );

      expect(spyUpdate).toHaveBeenCalledTimes(1);
      expect(mockCloseWarningTransaction).toHaveBeenCalledTimes(1);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
