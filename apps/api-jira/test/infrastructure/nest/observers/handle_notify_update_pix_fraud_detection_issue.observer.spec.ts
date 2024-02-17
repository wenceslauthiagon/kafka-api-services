import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { PixFraudDetectionStatus } from '@zro/pix-payments/domain';
import {
  NotifyPixFraudDetectionIssueEntity,
  NotifyPixFraudDetectionIssueRepository,
} from '@zro/api-jira/domain';
import { AppModule } from '@zro/api-jira/infrastructure/nest/modules/app.module';
import {
  NotifyUpdatePixFraudDetectionIssueNestObserver,
  NotifyPixFraudDetectionIssueDatabaseRepository,
} from '@zro/api-jira/infrastructure';
import { PixPaymentServiceKafka } from '@zro/api-jira/infrastructure';
import { HandleNotifyUpdatePixFraudDetectionIssueEventRequest } from '@zro/api-jira/interface';
import { NotifyPixFraudDetectionIssueFactory } from '@zro/test/api-jira/config';

describe('NotifyUpdatePixFraudDetectionIssueNestObserver', () => {
  let module: TestingModule;
  let controller: NotifyUpdatePixFraudDetectionIssueNestObserver;
  let notifyPixFraudDetectionIssueRepository: NotifyPixFraudDetectionIssueRepository;

  const pixPaymentService: PixPaymentServiceKafka =
    createMock<PixPaymentServiceKafka>();
  const mockRegisterPixFraudDetection: jest.Mock = On(pixPaymentService).get(
    method((mock) => mock.registerPixFraudDetection),
  );
  const mockCancelPixFraudDetection: jest.Mock = On(pixPaymentService).get(
    method((mock) => mock.cancelRegisteredPixFraudDetection),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<NotifyUpdatePixFraudDetectionIssueNestObserver>(
      NotifyUpdatePixFraudDetectionIssueNestObserver,
    );
    notifyPixFraudDetectionIssueRepository =
      new NotifyPixFraudDetectionIssueDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('handleNotifyUpdatePixFraudDetectionIssueEventViaPixPayment', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle update issue successfully when cancel infraction', async () => {
        const data =
          await NotifyPixFraudDetectionIssueFactory.create<NotifyPixFraudDetectionIssueEntity>(
            NotifyPixFraudDetectionIssueEntity.name,
            { status: PixFraudDetectionStatus.CANCELED_REGISTERED },
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

        const spyCreate = jest.spyOn(
          notifyPixFraudDetectionIssueRepository,
          'create',
        );

        await controller.handleNotifyUpdatePixFraudDetectionIssueEventViaPixPayment(
          message,
          logger,
          notifyPixFraudDetectionIssueRepository,
          pixPaymentService,
          ctx,
        );

        expect(spyCreate).toHaveBeenCalledTimes(1);
        expect(mockCancelPixFraudDetection).toHaveBeenCalledTimes(1);
        expect(mockRegisterPixFraudDetection).toHaveBeenCalledTimes(0);
      });

      it('TC0002 - Should handle update issue successfully when registered infraction', async () => {
        const data =
          await NotifyPixFraudDetectionIssueFactory.create<NotifyPixFraudDetectionIssueEntity>(
            NotifyPixFraudDetectionIssueEntity.name,
            { status: PixFraudDetectionStatus.REGISTERED },
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

        const spyCreate = jest.spyOn(
          notifyPixFraudDetectionIssueRepository,
          'create',
        );

        await controller.handleNotifyUpdatePixFraudDetectionIssueEventViaPixPayment(
          message,
          logger,
          notifyPixFraudDetectionIssueRepository,
          pixPaymentService,
          ctx,
        );

        expect(spyCreate).toHaveBeenCalledTimes(1);
        expect(mockCancelPixFraudDetection).toHaveBeenCalledTimes(0);
        expect(mockRegisterPixFraudDetection).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
