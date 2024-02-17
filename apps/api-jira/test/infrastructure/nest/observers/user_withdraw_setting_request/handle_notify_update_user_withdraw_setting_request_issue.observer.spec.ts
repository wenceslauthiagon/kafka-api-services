import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger } from '@zro/common';
import {
  UserWithdrawSettingRequestAnalysisResultType,
  UserWithdrawSettingRequestState,
} from '@zro/compliance/domain';
import { NotifyUserWithdrawSettingRequestIssueRepository } from '@zro/api-jira/domain';
import { AppModule } from '@zro/api-jira/infrastructure/nest/modules/app.module';
import {
  NotifyUpdateUserWithdrawSettingRequestIssueNestObserver,
  NotifyUserWithdrawSettingRequestIssueDatabaseRepository,
  NotifyUserWithdrawSettingRequestIssueModel,
  ComplianceServiceKafka,
} from '@zro/api-jira/infrastructure';
import { HandleNotifyUpdateUserWithdrawSettingRequestIssueEventRequest } from '@zro/api-jira/interface';
import { NotifyUserWithdrawSettingRequestIssueFactory } from '@zro/test/api-jira/config';

describe('NotifyUpdateUserWithdrawSettingRequestIssueNestObserver', () => {
  let module: TestingModule;
  let controller: NotifyUpdateUserWithdrawSettingRequestIssueNestObserver;
  let notifyIssueRepository: NotifyUserWithdrawSettingRequestIssueRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  const complianceService: ComplianceServiceKafka =
    createMock<ComplianceServiceKafka>();
  const mockCloseUserWithdrawSettingRequest: jest.Mock = On(
    complianceService,
  ).get(method((mock) => mock.closeUserWithdrawSettingRequest));

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller =
      module.get<NotifyUpdateUserWithdrawSettingRequestIssueNestObserver>(
        NotifyUpdateUserWithdrawSettingRequestIssueNestObserver,
      );
    notifyIssueRepository =
      new NotifyUserWithdrawSettingRequestIssueDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('handleNotifyUpdateUserWithdrawSettingRequestIssueDeadLetterEvent', () => {
    it('TC0001 - Should handle failed issue successfully', async () => {
      const data =
        await NotifyUserWithdrawSettingRequestIssueFactory.create<NotifyUserWithdrawSettingRequestIssueModel>(
          NotifyUserWithdrawSettingRequestIssueModel.name,
        );
      const message: HandleNotifyUpdateUserWithdrawSettingRequestIssueEventRequest =
        {
          issueId: data.issueId,
          status: data.status,
          userWithdrawSettingRequestId: data.userWithdrawSettingRequestId,
          summary: data.summary,
          issueCreatedAt: new Date(),
        };

      const spyUpdate = jest.spyOn(notifyIssueRepository, 'create');

      await controller.handleNotifyUpdateUserWithdrawSettingRequestIssueDeadLetterEvent(
        message,
        logger,
        notifyIssueRepository,
      );

      expect(spyUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleNotifyUpdateUserWithdrawSettingRequestIssueEventViaPixPayment', () => {
    it('TC0002 - Should handle created issue successfully', async () => {
      const data =
        await NotifyUserWithdrawSettingRequestIssueFactory.create<NotifyUserWithdrawSettingRequestIssueModel>(
          NotifyUserWithdrawSettingRequestIssueModel.name,
          { status: UserWithdrawSettingRequestState.CLOSED },
        );
      const message: HandleNotifyUpdateUserWithdrawSettingRequestIssueEventRequest =
        {
          issueId: faker.datatype.number({ min: 1, max: 99999 }).toString(),
          status: data.status,
          userWithdrawSettingRequestId: data.userWithdrawSettingRequestId,
          summary: data.summary,
          issueCreatedAt: new Date(),
          analysisResult: UserWithdrawSettingRequestAnalysisResultType.REJECTED,
        };
      const spyUpdate = jest.spyOn(notifyIssueRepository, 'create');

      await controller.handleNotifyUpdateUserWithdrawSettingRequestIssueEventViaComplianceGateway(
        message,
        logger,
        notifyIssueRepository,
        complianceService,
        ctx,
      );

      expect(spyUpdate).toHaveBeenCalledTimes(1);
      expect(mockCloseUserWithdrawSettingRequest).toHaveBeenCalledTimes(1);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
