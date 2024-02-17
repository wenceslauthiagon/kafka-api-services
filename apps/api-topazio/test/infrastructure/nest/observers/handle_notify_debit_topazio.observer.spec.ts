import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { KafkaService, defaultLogger as logger } from '@zro/common';
import {
  NotifyDebitEntity,
  NotifyDebitRepository,
} from '@zro/api-topazio/domain';
import {
  NotifyDebitTopazioNestObserver as Observer,
  NotifyDebitDatabaseRepository,
} from '@zro/api-topazio/infrastructure';
import { AppModule } from '@zro/api-topazio/infrastructure/nest/modules/app.module';
import { HandleNotifyDebitTopazioEventRequest } from '@zro/api-topazio/interface';
import { NotifyDebitFactory } from '@zro/test/api-topazio/config';

describe('NotifyDebitTopazioNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let notifyDebitRepository: NotifyDebitRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();
  const kafkaService: KafkaService = createMock<KafkaService>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = new Observer(kafkaService);
    notifyDebitRepository = new NotifyDebitDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleNotifyDebitTopazioEventViaPixKey', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle notify debit successfully', async () => {
        const data = await NotifyDebitFactory.create<NotifyDebitEntity>(
          NotifyDebitEntity.name,
          { isDevolution: false },
        );
        const message: HandleNotifyDebitTopazioEventRequest = {
          transactionId: data.transactionId,
        };
        const spyCreate = jest.spyOn(notifyDebitRepository, 'create');

        await controller.handleNotifyDebitTopazioEventViaPixPayment(
          message,
          logger,
          notifyDebitRepository,
          ctx,
        );

        expect(spyCreate).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
