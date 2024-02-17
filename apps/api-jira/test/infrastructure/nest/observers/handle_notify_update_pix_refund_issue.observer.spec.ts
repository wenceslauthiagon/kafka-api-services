import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger } from '@zro/common';
import { NotifyPixRefundIssueRepository } from '@zro/api-jira/domain';
import { PixRefundStatus } from '@zro/pix-payments/domain';
import {
  NotifyUpdatePixRefundIssueNestObserver,
  NotifyPixRefundIssueDatabaseRepository,
  NotifyPixRefundIssueModel,
  PixPaymentServiceKafka,
} from '@zro/api-jira/infrastructure';
import { AppModule } from '@zro/api-jira/infrastructure/nest/modules/app.module';
import { HandleNotifyUpdatePixRefundIssueEventRequest } from '@zro/api-jira/interface';
import { NotifyPixRefundIssueFactory } from '@zro/test/api-jira/config';

describe('NotifyUpdatePixRefundIssueNestObserver', () => {
  let module: TestingModule;
  let controller: NotifyUpdatePixRefundIssueNestObserver;
  let notifyPixRefundIssueRepository: NotifyPixRefundIssueRepository;

  const pixPaymentService: PixPaymentServiceKafka =
    createMock<PixPaymentServiceKafka>();
  const mockCancelPixRefund: jest.Mock = On(pixPaymentService).get(
    method((mock) => mock.cancelPixRefund),
  );
  const mockClosePixRefund: jest.Mock = On(pixPaymentService).get(
    method((mock) => mock.closePixRefund),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<NotifyUpdatePixRefundIssueNestObserver>(
      NotifyUpdatePixRefundIssueNestObserver,
    );
    notifyPixRefundIssueRepository =
      new NotifyPixRefundIssueDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('handleNotifyUpdatePixRefundIssueEventViaPixPayment', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle update issue successfully when close refund', async () => {
        const data =
          await NotifyPixRefundIssueFactory.create<NotifyPixRefundIssueModel>(
            NotifyPixRefundIssueModel.name,
            { status: PixRefundStatus.CLOSED },
          );
        const message: HandleNotifyUpdatePixRefundIssueEventRequest = {
          issueId: faker.datatype.number({ min: 1, max: 99999 }),
          status: data.status,
          operationId: data.operationId,
          description: data.description,
          reason: data.reason,
          summary: data.summary,
          issueCreatedAt: new Date(),
        };
        const spyUpdate = jest.spyOn(notifyPixRefundIssueRepository, 'create');

        await controller.handleNotifyUpdatePixRefundIssueEventViaPixPayment(
          message,
          logger,
          notifyPixRefundIssueRepository,
          pixPaymentService,
          ctx,
        );

        expect(spyUpdate).toHaveBeenCalledTimes(1);
        expect(mockClosePixRefund).toHaveBeenCalledTimes(1);
        expect(mockCancelPixRefund).toHaveBeenCalledTimes(0);
      });

      it('TC0002 - Should handle update issue successfully when cancel refund', async () => {
        const data =
          await NotifyPixRefundIssueFactory.create<NotifyPixRefundIssueModel>(
            NotifyPixRefundIssueModel.name,
            { status: PixRefundStatus.CANCELLED },
          );
        const message: HandleNotifyUpdatePixRefundIssueEventRequest = {
          issueId: faker.datatype.number({ min: 1, max: 99999 }),
          status: data.status,
          operationId: data.operationId,
          description: data.description,
          reason: data.reason,
          summary: data.summary,
          issueCreatedAt: new Date(),
        };

        const spyUpdate = jest.spyOn(notifyPixRefundIssueRepository, 'create');

        await controller.handleNotifyUpdatePixRefundIssueEventViaPixPayment(
          message,
          logger,
          notifyPixRefundIssueRepository,
          pixPaymentService,
          ctx,
        );

        expect(spyUpdate).toHaveBeenCalledTimes(1);
        expect(mockClosePixRefund).toHaveBeenCalledTimes(0);
        expect(mockCancelPixRefund).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
