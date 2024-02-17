import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  PaymentInvalidStateException,
  PaymentNotFoundException,
} from '@zro/pix-payments/application';
import { PaymentRepository, PaymentState } from '@zro/pix-payments/domain';
import {
  CancelPaymentByOperationIdRequest,
  PaymentEventEmitterControllerInterface,
  PaymentEventType,
} from '@zro/pix-payments/interface';
import {
  CancelPaymentByOperationIdMicroserviceController as Controller,
  PaymentDatabaseRepository,
  PaymentModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PaymentFactory } from '@zro/test/pix-payments/config';

describe('CancelPaymentByOperationIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let paymentRepository: PaymentRepository;

  const eventEmitter: PaymentEventEmitterControllerInterface =
    createMock<PaymentEventEmitterControllerInterface>();
  const mockEmitPaymentEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitPaymentEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    paymentRepository = new PaymentDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CancelPayment', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should cancel scheduled payment successfully', async () => {
        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
          { state: PaymentState.SCHEDULED },
        );

        const message: CancelPaymentByOperationIdRequest = {
          operationId: payment.operationId,
          userId: payment.userId,
          walletId: payment.walletId,
        };

        await controller.execute(
          paymentRepository,
          eventEmitter,
          logger,
          message,
          ctx,
        );

        expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPaymentEvent.mock.calls[0][0]).toBe(
          PaymentEventType.CANCELED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - should not cancel with state PENDING', async () => {
        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
          { state: PaymentState.PENDING },
        );

        const message: CancelPaymentByOperationIdRequest = {
          operationId: payment.operationId,
          userId: payment.userId,
          walletId: payment.walletId,
        };

        const testScript = () =>
          controller.execute(
            paymentRepository,
            eventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PaymentInvalidStateException);
        expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - should not cancel with state FAILED', async () => {
        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
          { state: PaymentState.FAILED },
        );

        const message: CancelPaymentByOperationIdRequest = {
          operationId: payment.operationId,
          userId: payment.userId,
          walletId: payment.walletId,
        };

        const testScript = () =>
          controller.execute(
            paymentRepository,
            eventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PaymentInvalidStateException);
        expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0004 - should not cancel with state CONFIRMED', async () => {
        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
          { state: PaymentState.CONFIRMED },
        );

        const message: CancelPaymentByOperationIdRequest = {
          operationId: payment.operationId,
          userId: payment.userId,
          walletId: payment.walletId,
        };

        const testScript = () =>
          controller.execute(
            paymentRepository,
            eventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PaymentInvalidStateException);
        expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0005 - should not cancel with state WAITING', async () => {
        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
          { state: PaymentState.WAITING },
        );

        const message: CancelPaymentByOperationIdRequest = {
          operationId: payment.operationId,
          userId: payment.userId,
          walletId: payment.walletId,
        };

        const testScript = () =>
          controller.execute(
            paymentRepository,
            eventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PaymentInvalidStateException);
        expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0006 - Should not cancel if payment is not found', async () => {
        const message: CancelPaymentByOperationIdRequest = {
          operationId: faker.datatype.uuid(),
          userId: faker.datatype.uuid(),
          walletId: faker.datatype.uuid(),
        };

        const testScript = () =>
          controller.execute(
            paymentRepository,
            eventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PaymentNotFoundException);
        expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0007 - Should not cancel if id is null', async () => {
        const message: CancelPaymentByOperationIdRequest = {
          operationId: null,
          userId: null,
          walletId: null,
        };

        const testScript = () =>
          controller.execute(
            paymentRepository,
            eventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
