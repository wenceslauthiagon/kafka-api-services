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
  NotifyCreatePixInfractionIssueNestObserver,
  NotifyPixInfractionIssueDatabaseRepository,
  NotifyPixInfractionIssueModel,
} from '@zro/api-jira/infrastructure';
import { PixPaymentServiceKafka } from '@zro/api-jira/infrastructure';
import { HandleNotifyCreatePixInfractionIssueEventRequest } from '@zro/api-jira/interface';
import { NotifyPixInfractionIssueFactory } from '@zro/test/api-jira/config';

describe('NotifyCreatePixInfractionIssueNestObserver', () => {
  let module: TestingModule;
  let controller: NotifyCreatePixInfractionIssueNestObserver;
  let notifyPixInfractionIssueRepository: NotifyPixInfractionIssueRepository;

  const pixPaymentService: PixPaymentServiceKafka =
    createMock<PixPaymentServiceKafka>();
  const mockCreatePixInfraction: jest.Mock = On(pixPaymentService).get(
    method((mock) => mock.createPixInfraction),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<NotifyCreatePixInfractionIssueNestObserver>(
      NotifyCreatePixInfractionIssueNestObserver,
    );
    notifyPixInfractionIssueRepository =
      new NotifyPixInfractionIssueDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('handleNotifyCreatePixInfractionIssueEventViaPixPayment', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle create issue successfully', async () => {
        const data =
          await NotifyPixInfractionIssueFactory.create<NotifyPixInfractionIssueModel>(
            NotifyPixInfractionIssueModel.name,
            { status: PixInfractionStatus.NEW },
          );

        const message: HandleNotifyCreatePixInfractionIssueEventRequest = {
          issueId: faker.datatype.number({ min: 1, max: 99999 }),
          status: data.status,
          operationId: data.operationId,
          description: data.description,
          infractionType: data.infractionType,
          summary: data.summary,
          issueCreatedAt: new Date(),
        };
        const spyCreate = jest.spyOn(
          notifyPixInfractionIssueRepository,
          'create',
        );

        await controller.handleNotifyCreatePixInfractionIssueEventViaPixPayment(
          message,
          logger,
          notifyPixInfractionIssueRepository,
          pixPaymentService,
          ctx,
        );

        expect(spyCreate).toHaveBeenCalledTimes(1);
        expect(mockCreatePixInfraction).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
