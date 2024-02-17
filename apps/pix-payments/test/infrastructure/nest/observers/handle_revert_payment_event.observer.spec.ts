import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { PaymentRepository, PaymentState } from '@zro/pix-payments/domain';
import {
  HandleRevertPaymentEventRequest,
  PaymentEventEmitterControllerInterface,
  PaymentEventType,
} from '@zro/pix-payments/interface';
import {
  RevertPaymentNestObserver as Observer,
  PaymentDatabaseRepository,
  PaymentModel,
  OperationServiceKafka,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PaymentFactory } from '@zro/test/pix-payments/config';

describe('RevertPaymentNestObserver', () => {
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
  const mockRevertOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.revertOperation),
  );
  const mockGetOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.getOperationById),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<Observer>(Observer);
    paymentRepository = new PaymentDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('handleRevertPaymentDeadLetterEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle failed Payment successfully', async () => {
        const { id, userId, walletId, state } =
          await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
            state: PaymentState.PENDING,
          });
        mockGetOperationService.mockResolvedValue({});

        const message: HandleRevertPaymentEventRequest = {
          id,
          userId,
          walletId,
          state,
        };

        await controller.execute(
          message,
          paymentRepository,
          eventEmitter,
          operationService,
          logger,
        );

        expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPaymentEvent.mock.calls[0][0]).toBe(
          PaymentEventType.FAILED,
        );
        expect(mockRevertOperationService).toHaveBeenCalledTimes(1);
      });

      it('TC0002 - Should handle failed Payment successfully and remove operation id if operation dont exists', async () => {
        const { id, userId, walletId, state } =
          await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
            state: PaymentState.PENDING,
          });
        mockGetOperationService.mockResolvedValue(undefined);

        const message: HandleRevertPaymentEventRequest = {
          id,
          userId,
          walletId,
          state,
        };

        await controller.execute(
          message,
          paymentRepository,
          eventEmitter,
          operationService,
          logger,
        );

        expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPaymentEvent.mock.calls[0][0]).toBe(
          PaymentEventType.FAILED,
        );
        expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not handle failed if incorrect state', async () => {
        const { id, userId, walletId, state } =
          await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
            state: PaymentState.ERROR,
          });

        const message: HandleRevertPaymentEventRequest = {
          id,
          userId,
          walletId,
          state,
        };

        await controller.execute(
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
