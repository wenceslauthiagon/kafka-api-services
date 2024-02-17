import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { PaymentRepository, PaymentState } from '@zro/pix-payments/domain';
import {
  ReceivePaymentChargebackUseCase as UseCase,
  OperationService,
  PaymentEventEmitter,
  PaymentInvalidStateException,
  PaymentNotFoundException,
} from '@zro/pix-payments/application';
import {
  PaymentDatabaseRepository,
  PaymentModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PaymentFactory } from '@zro/test/pix-payments/config';

describe('ReceivePaymentChargebackUseCase', () => {
  let module: TestingModule;
  let paymentRepository: PaymentRepository;

  const eventEmitter: PaymentEventEmitter = createMock<PaymentEventEmitter>();
  const mockFailedEventEmitter: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.failedPayment),
  );

  const operationService: OperationService = createMock<OperationService>();
  const mockRevertOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.revertOperation),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    paymentRepository = new PaymentDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should create Payment chargeback successfully', async () => {
      const payment = await PaymentFactory.create<PaymentModel>(
        PaymentModel.name,
        {
          state: PaymentState.WAITING,
        },
      );

      const usecase = new UseCase(
        logger,
        paymentRepository,
        eventEmitter,
        operationService,
      );
      const result = await usecase.execute(payment.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(payment.id);
      expect(result.state).toBe(PaymentState.FAILED);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should create Payment chargeback if state is failed', async () => {
      const payment = await PaymentFactory.create<PaymentModel>(
        PaymentModel.name,
        {
          state: PaymentState.FAILED,
        },
      );

      const usecase = new UseCase(
        logger,
        paymentRepository,
        eventEmitter,
        operationService,
      );
      const result = await usecase.execute(payment.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(payment.id);
      expect(result.state).toBe(PaymentState.FAILED);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not create Payment chargeback if incorrect state', async () => {
      const payment = await PaymentFactory.create<PaymentModel>(
        PaymentModel.name,
        {
          state: PaymentState.CONFIRMED,
        },
      );

      const usecase = new UseCase(
        logger,
        paymentRepository,
        eventEmitter,
        operationService,
      );
      const testScript = () => usecase.execute(payment.id);

      await expect(testScript).rejects.toThrow(PaymentInvalidStateException);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not revert if id is null', async () => {
      const usecase = new UseCase(
        logger,
        paymentRepository,
        eventEmitter,
        operationService,
      );

      const testScript = () => usecase.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not revert if id is not found', async () => {
      const usecase = new UseCase(
        logger,
        paymentRepository,
        eventEmitter,
        operationService,
      );

      const testScript = () => usecase.execute(uuidV4());

      await expect(testScript).rejects.toThrow(PaymentNotFoundException);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
