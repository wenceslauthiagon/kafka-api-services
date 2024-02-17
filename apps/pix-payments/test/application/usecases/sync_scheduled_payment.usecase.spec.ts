import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { getMoment, defaultLogger as logger } from '@zro/common';
import { PaymentState, PaymentRepository } from '@zro/pix-payments/domain';
import {
  SyncScheduledPaymentUseCase as UseCase,
  PaymentEventEmitter,
} from '@zro/pix-payments/application';
import {
  PaymentDatabaseRepository,
  PaymentModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PaymentFactory } from '@zro/test/pix-payments/config';

describe('SyncScheduledPaymentUseCase', () => {
  let module: TestingModule;
  let paymentRepository: PaymentRepository;

  const paymentEventEmitter: PaymentEventEmitter =
    createMock<PaymentEventEmitter>();
  const mockPendingPaymentEvent: jest.Mock = On(paymentEventEmitter).get(
    method((mock) => mock.pendingPayment),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    paymentRepository = new PaymentDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should sync scheduled payment successfully when date is today', async () => {
      const date = getMoment().format('YYYY-MM-DD');

      await PaymentModel.truncate();
      await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
        state: PaymentState.SCHEDULED,
        paymentDate: getMoment(date).toDate(),
      });

      const usecase = new UseCase(
        logger,
        paymentRepository,
        paymentEventEmitter,
      );

      const result = await usecase.execute();
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].state).toBe(PaymentState.PENDING);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should sync scheduled payment successfully but dont change for pending because date is not today', async () => {
      const date = getMoment().add(5, 'd').format('YYYY-MM-DD');

      await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
        state: PaymentState.SCHEDULED,
        paymentDate: getMoment(date).toDate(),
      });

      const usecase = new UseCase(
        logger,
        paymentRepository,
        paymentEventEmitter,
      );

      const result = await usecase.execute();

      expect(result).toBeDefined();
      expect(result.length).toBe(0);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
