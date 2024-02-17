import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, FailedEntity } from '@zro/common';
import {
  GetPaymentByIdMicroserviceController as Controller,
  PaymentDatabaseRepository,
  PaymentModel,
} from '@zro/pix-payments/infrastructure';
import { GetPaymentByIdRequest } from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PaymentFactory } from '@zro/test/pix-payments/config';

describe('GetPaymentByIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let paymentRepository: PaymentDatabaseRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    paymentRepository = new PaymentDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetPaymentById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get by id successfully', async () => {
        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
        );

        const message: GetPaymentByIdRequest = {
          id: payment.id,
        };

        const result = await controller.execute(
          paymentRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(payment.id);
        expect(result.value.userId).toBe(payment.userId);
        expect(result.value.operationId).toBe(payment.operationId);
        expect(result.value.state).toBe(payment.state);
        expect(result.value.value).toBe(payment.value);
        expect(result.value.paymentDate).toBeDefined();
        expect(result.value.description).toBeDefined();
        expect(result.value.failed?.code).toBeUndefined();
        expect(result.value.failed?.message).toBeUndefined();
        expect(result.value.createdAt).toBeDefined();
      });

      it('TC0002 - Should get by id and user', async () => {
        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
        );

        const message: GetPaymentByIdRequest = {
          id: payment.id,
          userId: payment.userId,
        };

        const result = await controller.execute(
          paymentRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(payment.id);
        expect(result.value.userId).toBe(payment.userId);
        expect(result.value.operationId).toBe(payment.operationId);
        expect(result.value.state).toBe(payment.state);
        expect(result.value.value).toBe(payment.value);
        expect(result.value.paymentDate).toBeDefined();
        expect(result.value.description).toBeDefined();
        expect(result.value.failed?.code).toBeUndefined();
        expect(result.value.failed?.message).toBeUndefined();
        expect(result.value.createdAt).toBeDefined();
      });

      it('TC0003 - Should get by id and wallet', async () => {
        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
        );

        const message: GetPaymentByIdRequest = {
          id: payment.id,
          walletId: payment.walletId,
        };

        const result = await controller.execute(
          paymentRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(payment.id);
        expect(result.value.userId).toBe(payment.userId);
        expect(result.value.operationId).toBe(payment.operationId);
        expect(result.value.state).toBe(payment.state);
        expect(result.value.value).toBe(payment.value);
        expect(result.value.paymentDate).toBeDefined();
        expect(result.value.description).toBeDefined();
        expect(result.value.failed?.code).toBeUndefined();
        expect(result.value.failed?.message).toBeUndefined();
        expect(result.value.createdAt).toBeDefined();
      });

      it('TC0004 - Should get by id successfully when failed exists', async () => {
        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
          {
            failed: new FailedEntity({
              code: 'PAYMENT_INVALID_STATE',
              message:
                'Status do pagamento inválido para operação. Por favor tente novamente.',
            }),
          },
        );

        const message: GetPaymentByIdRequest = {
          id: payment.id,
        };

        const result = await controller.execute(
          paymentRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(payment.id);
        expect(result.value.userId).toBe(payment.userId);
        expect(result.value.operationId).toBe(payment.operationId);
        expect(result.value.state).toBe(payment.state);
        expect(result.value.value).toBe(payment.value);
        expect(result.value.paymentDate).toBeDefined();
        expect(result.value.description).toBeDefined();
        expect(result.value.failed.code).toBeDefined();
        expect(result.value.failed.message).toBeDefined();
        expect(result.value.createdAt).toBeDefined();
      });

      it('TC0005 - Should not get by id and wallet not found', async () => {
        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
        );

        const message: GetPaymentByIdRequest = {
          id: payment.id,
          walletId: uuidV4(),
        };

        const result = await controller.execute(
          paymentRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeNull();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
