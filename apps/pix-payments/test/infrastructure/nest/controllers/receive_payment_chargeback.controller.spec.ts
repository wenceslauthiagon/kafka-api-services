import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PaymentRepository, PaymentState } from '@zro/pix-payments/domain';
import {
  ReceivePaymentChargebackMicroserviceController as Controller,
  PaymentDatabaseRepository,
  PaymentModel,
  OperationServiceKafka,
} from '@zro/pix-payments/infrastructure';
import { PaymentFactory } from '@zro/test/pix-payments/config';
import {
  PaymentEventEmitterControllerInterface,
  PaymentEventType,
  ReceivePaymentChargebackRequest,
} from '@zro/pix-payments/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('ReceivePaymentChargebackMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
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

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    paymentRepository = new PaymentDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should create pixDevolution chargeback with default message', async () => {
      const { id } = await PaymentFactory.create<PaymentModel>(
        PaymentModel.name,
        {
          state: PaymentState.WAITING,
        },
      );
      mockGetOperationService.mockResolvedValue({});

      const message: ReceivePaymentChargebackRequest = {
        id,
        chargebackReason: 'REASON',
      };

      const result = await controller.execute(
        message,
        paymentRepository,
        eventEmitter,
        operationService,
        logger,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();

      expect(result.value).toBeDefined();
      expect(result.value.id).toBe(id);
      expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitPaymentEvent.mock.calls[0][0]).toBe(
        PaymentEventType.FAILED,
      );
      expect(mockRevertOperationService).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should create pixDevolution chargeback successfully', async () => {
      const { id } = await PaymentFactory.create<PaymentModel>(
        PaymentModel.name,
        {
          state: PaymentState.WAITING,
        },
      );
      mockGetOperationService.mockResolvedValue({});

      const message: ReceivePaymentChargebackRequest = {
        id,
        chargebackReason: 'SL02:ChargebackSL02Exception',
      };

      const result = await controller.execute(
        message,
        paymentRepository,
        eventEmitter,
        operationService,
        logger,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();

      expect(result.value).toBeDefined();
      expect(result.value.id).toBe(id);
      expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitPaymentEvent.mock.calls[0][0]).toBe(
        PaymentEventType.FAILED,
      );
      expect(mockRevertOperationService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not create pixDevolution chargeback if state is failed', async () => {
      const { id, state } = await PaymentFactory.create<PaymentModel>(
        PaymentModel.name,
        { state: PaymentState.FAILED },
      );
      mockGetOperationService.mockResolvedValue(undefined);

      const message: ReceivePaymentChargebackRequest = {
        id,
      };

      const result = await controller.execute(
        message,
        paymentRepository,
        eventEmitter,
        operationService,
        logger,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();

      expect(result.value).toBeDefined();
      expect(result.value.id).toBe(id);
      expect(result.value.state).toBe(state);
      expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
