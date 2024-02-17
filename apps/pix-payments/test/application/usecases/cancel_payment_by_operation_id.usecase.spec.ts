import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { OperationEntity, WalletEntity } from '@zro/operations/domain';
import { PaymentRepository, PaymentState } from '@zro/pix-payments/domain';
import {
  CancelPaymentByOperationIdUseCase as UseCase,
  PaymentEventEmitter,
  PaymentNotFoundException,
  PaymentInvalidStateException,
} from '@zro/pix-payments/application';
import {
  PaymentDatabaseRepository,
  PaymentModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PaymentFactory } from '@zro/test/pix-payments/config';

describe('CancelPaymentByOperationIdUseCase', () => {
  let module: TestingModule;
  let paymentRepository: PaymentRepository;

  const eventEmitter: PaymentEventEmitter = createMock<PaymentEventEmitter>();

  const mockCanceledEventEmitter: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.canceledPayment),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    paymentRepository = new PaymentDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - should cancel scheduled payment successfully', async () => {
      const payment = (
        await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
          state: PaymentState.SCHEDULED,
        })
      ).toDomain();

      const usecase = new UseCase(logger, paymentRepository, eventEmitter);

      const result = await usecase.execute(payment.wallet, payment.operation);

      expect(result).toBeDefined();
      expect(result.id).toBe(payment.id);
      expect(result.state).toBe(PaymentState.CANCELED);
      expect(mockCanceledEventEmitter).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - should not cancel with state PENDING', async () => {
      const payment = (
        await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
          userId: faker.datatype.uuid(),
          state: PaymentState.PENDING,
        })
      ).toDomain();

      const usecase = new UseCase(logger, paymentRepository, eventEmitter);

      const testScript = () =>
        usecase.execute(payment.wallet, payment.operation);

      await expect(testScript).rejects.toThrow(PaymentInvalidStateException);
      expect(mockCanceledEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - should not cancel with state FAILED', async () => {
      const payment = (
        await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
          userId: faker.datatype.uuid(),
          state: PaymentState.FAILED,
        })
      ).toDomain();

      const usecase = new UseCase(logger, paymentRepository, eventEmitter);

      const testScript = () =>
        usecase.execute(payment.wallet, payment.operation);

      await expect(testScript).rejects.toThrow(PaymentInvalidStateException);
      expect(mockCanceledEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - should not cancel with state CONFIRMED', async () => {
      const payment = (
        await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
          userId: faker.datatype.uuid(),
          state: PaymentState.CONFIRMED,
        })
      ).toDomain();

      const usecase = new UseCase(logger, paymentRepository, eventEmitter);

      const testScript = () =>
        usecase.execute(payment.wallet, payment.operation);

      await expect(testScript).rejects.toThrow(PaymentInvalidStateException);
      expect(mockCanceledEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - should not cancel with state WAITING', async () => {
      const payment = (
        await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
          userId: faker.datatype.uuid(),
          state: PaymentState.WAITING,
        })
      ).toDomain();

      const usecase = new UseCase(logger, paymentRepository, eventEmitter);

      const testScript = () =>
        usecase.execute(payment.wallet, payment.operation);

      await expect(testScript).rejects.toThrow(PaymentInvalidStateException);
      expect(mockCanceledEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not cancel if payment is not found', async () => {
      const usecase = new UseCase(logger, paymentRepository, eventEmitter);

      const wallet = new WalletEntity({ uuid: faker.datatype.uuid() });
      const operation = new OperationEntity({ id: faker.datatype.uuid() });

      const testScript = () => usecase.execute(wallet, operation);

      await expect(testScript).rejects.toThrow(PaymentNotFoundException);
      expect(mockCanceledEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not cancel if id is null', async () => {
      const usecase = new UseCase(logger, paymentRepository, eventEmitter);

      const wallet = new WalletEntity({ uuid: faker.datatype.uuid() });

      const testScript = () => usecase.execute(wallet, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCanceledEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
