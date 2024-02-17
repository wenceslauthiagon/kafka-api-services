import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common/test';
import {
  GetPaymentByEndToEndIdMicroserviceController as Controller,
  PaymentDatabaseRepository,
  PaymentModel,
} from '@zro/pix-payments/infrastructure';
import { GetPaymentByEndToEndIdRequest } from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PaymentFactory } from '@zro/test/pix-payments/config';

describe('GetPaymentByEndToEndIdMicroserviceController', () => {
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

  describe('GetPaymentByEndToEndId', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get by EndToEndId successfully', async () => {
        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
        );

        const message: GetPaymentByEndToEndIdRequest = {
          endToEndId: payment.endToEndId,
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
        expect(result.value.state).toBe(payment.state);
        expect(result.value.value).toBe(payment.value);
        expect(result.value.endToEndId).toBe(payment.endToEndId);
        expect(result.value.createdAt).toBeDefined();
      });

      it('TC0002 - Should get by EndToEndId and user', async () => {
        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
        );

        const message: GetPaymentByEndToEndIdRequest = {
          endToEndId: payment.endToEndId,
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
        expect(result.value.state).toBe(payment.state);
        expect(result.value.value).toBe(payment.value);
        expect(result.value.endToEndId).toBe(payment.endToEndId);
        expect(result.value.createdAt).toBeDefined();
      });

      it('TC0003 - Should get by EndToEndId and wallet', async () => {
        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
        );

        const message: GetPaymentByEndToEndIdRequest = {
          endToEndId: payment.endToEndId,
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
        expect(result.value.state).toBe(payment.state);
        expect(result.value.value).toBe(payment.value);
        expect(result.value.endToEndId).toBe(payment.endToEndId);
        expect(result.value.createdAt).toBeDefined();
      });

      it('TC0004 - Should not get by EndToEndId and wallet not found', async () => {
        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
        );

        const message: GetPaymentByEndToEndIdRequest = {
          endToEndId: payment.endToEndId,
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
