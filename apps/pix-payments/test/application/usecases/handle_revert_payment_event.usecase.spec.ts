import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PaymentEntity,
  PaymentRepository,
  PaymentState,
} from '@zro/pix-payments/domain';
import {
  HandleRevertPaymentEventUseCase as UseCase,
  PaymentEventEmitter,
  OperationService,
  PaymentInvalidStateException,
  PaymentNotFoundException,
} from '@zro/pix-payments/application';
import { PaymentFactory } from '@zro/test/pix-payments/config';

describe('HandleRevertPaymentEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      paymentRepository,
      mockUpdatePaymentRepository,
      mockGetPaymentByIdRepository,
    } = mockRepository();

    const { eventEmitter, mockFailedEventEmitter } = mockEmitter();

    const { operationService, mockRevertOperationService } = mockService();

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
      mockFailedEventEmitter,
      mockRevertOperationService,
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
    const mockFailedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.failedPayment),
    );

    return {
      eventEmitter,
      mockFailedEventEmitter,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockRevertOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.revertOperation),
    );

    return {
      operationService,
      mockRevertOperationService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle pending failed when id is null', async () => {
      const { sut } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });

    it('TC0002 - Should not handle pending failed when payment not found', async () => {
      const { sut, mockGetPaymentByIdRepository } = makeSut();
      const { id } = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
      );
      mockGetPaymentByIdRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(id);

      await expect(testScript).rejects.toThrow(PaymentNotFoundException);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(id);
    });

    it('TC0003 - Should not handle pending failed when status is not pending', async () => {
      const { sut, mockGetPaymentByIdRepository } = makeSut();
      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        { state: PaymentState.CANCELED },
      );
      mockGetPaymentByIdRepository.mockResolvedValue(payment);

      const testScript = () => sut.execute(payment.id);

      expect(testScript).rejects.toThrow(PaymentInvalidStateException);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(payment.id);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should handle pending failed payment and revert operation', async () => {
      const {
        sut,
        mockGetPaymentByIdRepository,
        mockUpdatePaymentRepository,
        mockFailedEventEmitter,
        mockRevertOperationService,
      } = makeSut();
      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        { state: PaymentState.PENDING },
      );
      mockGetPaymentByIdRepository.mockResolvedValue(payment);

      const result = await sut.execute(payment.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PaymentState.FAILED);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(payment.id);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(1);
      expect(mockUpdatePaymentRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should not handle revert operation if state is failed', async () => {
      const {
        sut,
        mockGetPaymentByIdRepository,
        mockUpdatePaymentRepository,
        mockFailedEventEmitter,
        mockRevertOperationService,
      } = makeSut();
      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        { state: PaymentState.FAILED },
      );
      mockGetPaymentByIdRepository.mockResolvedValue(payment);

      const result = await sut.execute(payment.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PaymentState.FAILED);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(payment.id);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
      expect(mockUpdatePaymentRepository).toHaveBeenCalledTimes(0);
    });
  });
});
