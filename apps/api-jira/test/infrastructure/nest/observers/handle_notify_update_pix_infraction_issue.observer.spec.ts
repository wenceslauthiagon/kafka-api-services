import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger } from '@zro/common';
import { PixInfractionStatus } from '@zro/pix-payments/domain';
import { NotifyPixInfractionIssueRepository } from '@zro/api-jira/domain';
import { AppModule } from '@zro/api-jira/infrastructure/nest/modules/app.module';
import {
  NotifyUpdatePixInfractionIssueNestObserver,
  NotifyPixInfractionIssueDatabaseRepository,
  NotifyPixInfractionIssueModel,
} from '@zro/api-jira/infrastructure';
import { PixPaymentServiceKafka } from '@zro/api-jira/infrastructure';
import { HandleNotifyUpdatePixInfractionIssueEventRequest } from '@zro/api-jira/interface';
import { NotifyPixInfractionIssueFactory } from '@zro/test/api-jira/config';

describe('NotifyUpdatePixInfractionIssueNestObserver', () => {
  let module: TestingModule;
  let controller: NotifyUpdatePixInfractionIssueNestObserver;
  let notifyPixInfractionIssueRepository: NotifyPixInfractionIssueRepository;

  const pixPaymentService: PixPaymentServiceKafka =
    createMock<PixPaymentServiceKafka>();
  const mockOpenedPixInfraction: jest.Mock = On(pixPaymentService).get(
    method((mock) => mock.openPixInfraction),
  );
  const mockClosePixInfraction: jest.Mock = On(pixPaymentService).get(
    method((mock) => mock.closePixInfraction),
  );
  const mockInAnalysisPixInfraction: jest.Mock = On(pixPaymentService).get(
    method((mock) => mock.inAnalysisPixInfraction),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<NotifyUpdatePixInfractionIssueNestObserver>(
      NotifyUpdatePixInfractionIssueNestObserver,
    );
    notifyPixInfractionIssueRepository =
      new NotifyPixInfractionIssueDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('handleNotifyUpdatePixInfractionIssueEventViaPixPayment', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle update issue successfully when close infraction', async () => {
        const data =
          await NotifyPixInfractionIssueFactory.create<NotifyPixInfractionIssueModel>(
            NotifyPixInfractionIssueModel.name,
            { status: PixInfractionStatus.CLOSED },
          );
        const message: HandleNotifyUpdatePixInfractionIssueEventRequest = {
          issueId: faker.datatype.number({ min: 1, max: 99999 }),
          status: data.status,
          operationId: data.operationId,
          description: data.description,
          infractionType: data.infractionType,
          summary: data.summary,
          issueCreatedAt: new Date(),
        };

        const spyUpdate = jest.spyOn(
          notifyPixInfractionIssueRepository,
          'create',
        );

        await controller.handleNotifyUpdatePixInfractionIssueEventViaPixPayment(
          message,
          logger,
          notifyPixInfractionIssueRepository,
          pixPaymentService,
          ctx,
        );

        expect(spyUpdate).toHaveBeenCalledTimes(1);
        expect(mockClosePixInfraction).toHaveBeenCalledTimes(1);
        expect(mockOpenedPixInfraction).toHaveBeenCalledTimes(0);
        expect(mockInAnalysisPixInfraction).toHaveBeenCalledTimes(0);
      });

      it('TC0002 - Should handle update issue successfully when opened infraction', async () => {
        const data =
          await NotifyPixInfractionIssueFactory.create<NotifyPixInfractionIssueModel>(
            NotifyPixInfractionIssueModel.name,
            { status: PixInfractionStatus.OPENED },
          );
        const message: HandleNotifyUpdatePixInfractionIssueEventRequest = {
          issueId: faker.datatype.number({ min: 1, max: 99999 }),
          status: data.status,
          operationId: data.operationId,
          description: data.description,
          infractionType: data.infractionType,
          summary: data.summary,
          issueCreatedAt: new Date(),
        };

        const spyUpdate = jest.spyOn(
          notifyPixInfractionIssueRepository,
          'create',
        );

        await controller.handleNotifyUpdatePixInfractionIssueEventViaPixPayment(
          message,
          logger,
          notifyPixInfractionIssueRepository,
          pixPaymentService,
          ctx,
        );

        expect(spyUpdate).toHaveBeenCalledTimes(1);
        expect(mockClosePixInfraction).toHaveBeenCalledTimes(0);
        expect(mockOpenedPixInfraction).toHaveBeenCalledTimes(1);
        expect(mockInAnalysisPixInfraction).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should handle update issue successfully when in analysis infraction', async () => {
        const data =
          await NotifyPixInfractionIssueFactory.create<NotifyPixInfractionIssueModel>(
            NotifyPixInfractionIssueModel.name,
            { status: PixInfractionStatus.IN_ANALYSIS },
          );
        const message: HandleNotifyUpdatePixInfractionIssueEventRequest = {
          issueId: faker.datatype.number({ min: 1, max: 99999 }),
          status: data.status,
          operationId: data.operationId,
          description: data.description,
          infractionType: data.infractionType,
          summary: data.summary,
          issueCreatedAt: new Date(),
        };

        const spyUpdate = jest.spyOn(
          notifyPixInfractionIssueRepository,
          'create',
        );

        await controller.handleNotifyUpdatePixInfractionIssueEventViaPixPayment(
          message,
          logger,
          notifyPixInfractionIssueRepository,
          pixPaymentService,
          ctx,
        );

        expect(spyUpdate).toHaveBeenCalledTimes(1);
        expect(mockClosePixInfraction).toHaveBeenCalledTimes(0);
        expect(mockOpenedPixInfraction).toHaveBeenCalledTimes(0);
        expect(mockInAnalysisPixInfraction).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
