import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { PaymentRepository, PaymentState } from '@zro/pix-payments/domain';
import {
  CompletePaymentNestObserver as Observer,
  PaymentDatabaseRepository,
  PaymentModel,
  OperationServiceKafka,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  HandleCompletePaymentEventRequest,
  PaymentEventEmitterControllerInterface,
  PaymentEventType,
} from '@zro/pix-payments/interface';
import { PaymentFactory } from '@zro/test/pix-payments/config';

describe('CompletePaymentNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let paymentRepository: PaymentRepository;

  const eventEmitter: PaymentEventEmitterControllerInterface =
    createMock<PaymentEventEmitterControllerInterface>();
  const mockEmitPaymentEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitPaymentEvent),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockAcceptOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.acceptOperation),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<Observer>(Observer);
    paymentRepository = new PaymentDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('handleCompletePaymentDeadLetterEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle complete Payment successfully', async () => {
        const { id, userId, walletId, state, endToEndId } =
          await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
            state: PaymentState.WAITING,
          });

        const message: HandleCompletePaymentEventRequest = {
          id,
          userId,
          walletId,
          state,
          endToEndId,
        };

        await controller.handleCompletePaymentEvent(
          message,
          paymentRepository,
          eventEmitter,
          operationService,
          logger,
        );

        expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPaymentEvent.mock.calls[0][0]).toBe(
          PaymentEventType.CONFIRMED,
        );
        expect(mockAcceptOperationService).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle complete if incorrect state', async () => {
        const { id, userId, walletId, state, endToEndId } =
          await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
            state: PaymentState.ERROR,
          });

        const message: HandleCompletePaymentEventRequest = {
          id,
          userId,
          walletId,
          state,
          endToEndId,
        };

        await controller.handleCompletePaymentEvent(
          message,
          paymentRepository,
          eventEmitter,
          operationService,
          logger,
        );

        expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
