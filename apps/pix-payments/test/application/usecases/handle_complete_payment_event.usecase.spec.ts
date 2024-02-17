import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PaymentEntity,
  PaymentRepository,
  PaymentState,
} from '@zro/pix-payments/domain';
import {
  HandleCompletePaymentEventUseCase as UseCase,
  PaymentEventEmitter,
  OperationService,
  PaymentInvalidStateException,
  PaymentNotFoundException,
} from '@zro/pix-payments/application';
import { PaymentFactory } from '@zro/test/pix-payments/config';

describe('HandleCompletePaymentEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      paymentRepository,
      mockUpdatePaymentRepository,
      mockGetPaymentByIdRepository,
    } = mockRepository();

    const { eventEmitter, mockConfirmedEventEmitter } = mockEmitter();

    const { operationService, mockAcceptOperationService } = mockService();

    const sut = new UseCase(
      logger,
      paymentRepository,
      eventEmitter,
      operationService,
    );
    return {
      sut,
      mockUpdatePaymentRepository,
      mockGetPaymentByIdRepository,
      mockConfirmedEventEmitter,
      mockAcceptOperationService,
    };
  };

  const mockRepository = () => {
    const paymentRepository: PaymentRepository =
      createMock<PaymentRepository>();
    const mockUpdatePaymentRepository: jest.Mock = On(paymentRepository).get(
      method((mock) => mock.update),
    );
    const mockGetPaymentByIdRepository: jest.Mock = On(paymentRepository).get(
      method((mock) => mock.getById),
    );

    return {
      paymentRepository,
      mockUpdatePaymentRepository,
      mockGetPaymentByIdRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: PaymentEventEmitter = createMock<PaymentEventEmitter>();
    const mockConfirmedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.confirmedPayment),
    );

    return {
      eventEmitter,
      mockConfirmedEventEmitter,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockAcceptOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.acceptOperation),
    );

    return {
      operationService,
      mockAcceptOperationService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle complete when id is null', async () => {
      const { sut } = makeSut();

      const testScript = () => sut.execute(null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });

    it('TC0002 - Should not handle complete when payment not found', async () => {
      const { sut, mockGetPaymentByIdRepository } = makeSut();
      const { id } = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
      );
      const endToEndId = 'ABC12312000872BBC';
      mockGetPaymentByIdRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(id, endToEndId);

      await expect(testScript).rejects.toThrow(PaymentNotFoundException);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(id);
    });

    it('TC0003 - Should not handle complete when payment is already completed', async () => {
      const { sut, mockGetPaymentByIdRepository } = makeSut();
      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        { state: PaymentState.CONFIRMED },
      );
      payment.isAlreadyCompletedPayment = () => true;
      const endToEndId = 'ABC12312000872BBC';
      mockGetPaymentByIdRepository.mockResolvedValue(payment);

      const result = await sut.execute(payment.id, endToEndId);

      expect(result).toBeDefined();
      expect(result.state).toBe(PaymentState.CONFIRMED);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(payment.id);
    });

    it('TC0004 - Should not handle pending failed when status is not waiting', async () => {
      const { sut, mockGetPaymentByIdRepository } = makeSut();
      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        { state: PaymentState.CANCELED },
      );
      payment.isAlreadyCompletedPayment = () => false;
      const endToEndId = 'ABC12312000872BBC';
      mockGetPaymentByIdRepository.mockResolvedValue(payment);

      const testScript = () => sut.execute(payment.id, endToEndId);

      expect(testScript).rejects.toThrow(PaymentInvalidStateException);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(payment.id);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should handle complete payment and accept operation', async () => {
      const {
        sut,
        mockGetPaymentByIdRepository,
        mockUpdatePaymentRepository,
        mockAcceptOperationService,
        mockConfirmedEventEmitter,
      } = makeSut();
      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        { state: PaymentState.WAITING },
      );
      payment.isAlreadyCompletedPayment = () => false;
      const endToEndId = 'ABC12312000872BBC';
      mockGetPaymentByIdRepository.mockResolvedValue(payment);

      const result = await sut.execute(payment.id, endToEndId);

      expect(result).toBeDefined();
      expect(result.endToEndId).toBe(endToEndId);
      expect(result.state).toBe(PaymentState.CONFIRMED);
      expect(result.confirmedAt).toBeDefined();
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(payment.id);
      expect(mockAcceptOperationService).toHaveBeenCalledTimes(1);
      expect(mockConfirmedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockUpdatePaymentRepository).toHaveBeenCalledTimes(1);
    });
  });
});
