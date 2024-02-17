import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService, defaultLogger as logger } from '@zro/common';
import { PaymentEntity, PixDevolutionEntity } from '@zro/pix-payments/domain';
import {
  NotifyCompletionEntity,
  NotifyCompletionRepository,
} from '@zro/api-topazio/domain';
import {
  NotifyCompletionTopazioNestObserver as Observer,
  NotifyCompletionDatabaseRepository,
  PixPaymentServiceKafka,
} from '@zro/api-topazio/infrastructure';
import { AppModule } from '@zro/api-topazio/infrastructure/nest/modules/app.module';
import {
  PixPaymentEventEmitterControllerInterface,
  PixDevolutionEventEmitterControllerInterface,
  PixPaymentEventType,
  PixDevolutionEventType,
  HandleNotifyCompletionTopazioEventRequest,
} from '@zro/api-topazio/interface';
import { NotifyCompletionFactory } from '@zro/test/api-topazio/config';
import {
  PaymentFactory,
  PixDevolutionFactory,
} from '@zro/test/pix-payments/config';

describe('NotifyCompletionTopazioNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let notifyCompletionRepository: NotifyCompletionRepository;

  const pixPaymentService: PixPaymentServiceKafka =
    createMock<PixPaymentServiceKafka>();
  const mockGetPaymentPixPaymentService: jest.Mock = On(pixPaymentService).get(
    method((mock) => mock.getPixPaymentById),
  );
  const mockGetDevolutionPixPaymentService: jest.Mock = On(
    pixPaymentService,
  ).get(method((mock) => mock.getPixDevolutionById));

  const pixPaymentEmitter: PixPaymentEventEmitterControllerInterface =
    createMock<PixPaymentEventEmitterControllerInterface>();
  const mockEmitPixPaymentEvent: jest.Mock = On(pixPaymentEmitter).get(
    method((mock) => mock.emitPaymentEvent),
  );

  const pixDevolutionEmitter: PixDevolutionEventEmitterControllerInterface =
    createMock<PixDevolutionEventEmitterControllerInterface>();
  const mockEmitPixDevolutionEvent: jest.Mock = On(pixDevolutionEmitter).get(
    method((mock) => mock.emitDevolutionEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();
  const kafkaService: KafkaService = createMock<KafkaService>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = new Observer(kafkaService);
    notifyCompletionRepository = new NotifyCompletionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleNotifyCompletionTopazioEventViaPixKey', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle notify completion successfully when isDevolution true', async () => {
        const data =
          await NotifyCompletionFactory.create<NotifyCompletionEntity>(
            NotifyCompletionEntity.name,
            { isDevolution: true },
          );
        const message: HandleNotifyCompletionTopazioEventRequest = {
          transactionId: data.transactionId,
          isDevolution: data.isDevolution,
          endToEndId: data.endToEndId,
          status: data.status,
        };

        const spyCreate = jest.spyOn(notifyCompletionRepository, 'create');

        const devolution =
          await PixDevolutionFactory.create<PixDevolutionEntity>(
            PixDevolutionEntity.name,
          );
        mockGetDevolutionPixPaymentService.mockResolvedValue(devolution);

        await controller.handleNotifyCompletionTopazioEventViaPixPayment(
          message,
          logger,
          notifyCompletionRepository,
          pixPaymentService,
          pixPaymentEmitter,
          pixDevolutionEmitter,
          ctx,
        );

        expect(spyCreate).toHaveBeenCalledTimes(1);
        expect(mockGetDevolutionPixPaymentService).toHaveBeenCalledTimes(1);
        expect(mockEmitPixDevolutionEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixDevolutionEvent.mock.calls[0][0]).toBe(
          PixDevolutionEventType.COMPLETED,
        );
      });

      it('TC0002 - Should handle notify completion when isDevolution false', async () => {
        const { transactionId, isDevolution, status, endToEndId } =
          await NotifyCompletionFactory.create<NotifyCompletionEntity>(
            NotifyCompletionEntity.name,
            { isDevolution: false },
          );

        const message: HandleNotifyCompletionTopazioEventRequest = {
          transactionId,
          isDevolution,
          endToEndId,
          status,
        };

        const payment = await PaymentFactory.create<PaymentEntity>(
          PaymentEntity.name,
        );
        mockGetPaymentPixPaymentService.mockResolvedValue(payment);

        const spyCreate = jest.spyOn(notifyCompletionRepository, 'create');

        await controller.handleNotifyCompletionTopazioEventViaPixPayment(
          message,
          logger,
          notifyCompletionRepository,
          pixPaymentService,
          pixPaymentEmitter,
          pixDevolutionEmitter,
          ctx,
        );

        expect(spyCreate).toHaveBeenCalledTimes(1);
        expect(mockGetPaymentPixPaymentService).toHaveBeenCalledTimes(1);
        expect(mockEmitPixPaymentEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixPaymentEvent.mock.calls[0][0]).toBe(
          PixPaymentEventType.COMPLETED,
        );
        expect(mockEmitPixDevolutionEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
