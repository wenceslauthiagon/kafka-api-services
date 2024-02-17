import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { v4 as uuidV4 } from 'uuid';
import { defaultLogger as logger, getMoment } from '@zro/common';
import {
  PaymentState,
  PaymentRepository,
  PaymentEntity,
  PaymentPriorityType,
} from '@zro/pix-payments/domain';
import {
  SyncWaitingRecentPaymentUseCase as UseCase,
  PaymentEventEmitter,
  PixPaymentGateway,
  TranslateService,
} from '@zro/pix-payments/application';
import { PaymentFactory } from '@zro/test/pix-payments/config';
import * as GetPaymentByIdPspGatewayMock from '@zro/test/pix-payments/config/mocks/get_payment_by_id.mock';

describe('SyncWaitingRecentPaymentUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PaymentEventEmitter = createMock<PaymentEventEmitter>();

    const mockCompletedPaymentEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.completedPayment),
    );

    const mockRevertedPaymentEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.revertedPayment),
    );

    return {
      eventEmitter,
      mockCompletedPaymentEvent,
      mockRevertedPaymentEvent,
    };
  };

  const mockRepository = () => {
    const repository: PaymentRepository = createMock<PaymentRepository>();
    const mockGetAllRepository: jest.Mock = On(repository).get(
      method((mock) => mock.getAllByStateThresholdDateAndPriorityType),
    );

    return {
      repository,
      mockGetAllRepository,
    };
  };

  const mockGateway = () => {
    const paymentGateway: PixPaymentGateway = createMock<PixPaymentGateway>();
    const mockGetPaymentByIdGateway: jest.Mock = On(paymentGateway).get(
      method((mock) => mock.getPaymentById),
    );

    return {
      paymentGateway,
      mockGetPaymentByIdGateway,
    };
  };

  const mockService = () => {
    const translateService: TranslateService = createMock<TranslateService>();
    const mockTranslateError: jest.Mock = On(translateService).get(
      method((mock) => mock.translatePixPaymentFailed),
    );

    return {
      translateService,
      mockTranslateError,
    };
  };

  const makeSut = () => {
    const { translateService, mockTranslateError } = mockService();
    const {
      eventEmitter,
      mockCompletedPaymentEvent,
      mockRevertedPaymentEvent,
    } = mockEmitter();

    const { repository, mockGetAllRepository } = mockRepository();

    const { paymentGateway, mockGetPaymentByIdGateway } = mockGateway();

    const updatedAtThresholdInSeconds = 40;

    const sut = new UseCase(
      logger,
      translateService,
      repository,
      eventEmitter,
      paymentGateway,
      updatedAtThresholdInSeconds,
    );

    return {
      sut,
      mockCompletedPaymentEvent,
      mockRevertedPaymentEvent,
      mockGetAllRepository,
      mockGetPaymentByIdGateway,
      mockTranslateError,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should emit completed event successfully when PixRefundDevolution exists and it is settled.', async () => {
      const {
        sut,
        mockCompletedPaymentEvent,
        mockRevertedPaymentEvent,
        mockGetAllRepository,
        mockGetPaymentByIdGateway,
        mockTranslateError,
      } = makeSut();

      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        {
          priorityType: PaymentPriorityType.PRIORITY,
          externalId: uuidV4(),
          state: PaymentState.WAITING,
          updatedAt: getMoment().toDate(),
        },
      );

      mockGetAllRepository.mockResolvedValue([payment]);

      mockGetPaymentByIdGateway.mockResolvedValue(
        GetPaymentByIdPspGatewayMock.successPaymentSettled(),
      );

      await sut.execute();

      expect(mockCompletedPaymentEvent).toHaveBeenCalledTimes(1);
      expect(mockRevertedPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockTranslateError).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should emit reverted event successfully when PixRefundDevolution exists and it is not settled.', async () => {
      const {
        sut,
        mockCompletedPaymentEvent,
        mockRevertedPaymentEvent,
        mockGetAllRepository,
        mockGetPaymentByIdGateway,
        mockTranslateError,
      } = makeSut();

      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        {
          priorityType: PaymentPriorityType.PRIORITY,
          externalId: uuidV4(),
          state: PaymentState.WAITING,
          updatedAt: getMoment().toDate(),
        },
      );

      mockGetAllRepository.mockResolvedValue([payment]);

      mockGetPaymentByIdGateway.mockResolvedValue(
        GetPaymentByIdPspGatewayMock.successPaymentNotSettled(),
      );
      const failed = {
        errorCode: 'AB03',
        errorMessage:
          'Liquidação da transação interrompida devido a timeout no SPI.',
      };
      mockTranslateError.mockResolvedValue(failed);

      await sut.execute();

      expect(mockCompletedPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockRevertedPaymentEvent).toHaveBeenCalledTimes(1);
      expect(mockTranslateError).toHaveBeenCalledTimes(1);
      expect(mockRevertedPaymentEvent).toHaveBeenCalledWith(
        expect.objectContaining({ failed }),
      );
    });

    it('TC0003 - Should not emit any event when PSP does not respond.', async () => {
      const {
        sut,
        mockCompletedPaymentEvent,
        mockRevertedPaymentEvent,
        mockGetAllRepository,
        mockGetPaymentByIdGateway,
        mockTranslateError,
      } = makeSut();

      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        {
          priorityType: PaymentPriorityType.PRIORITY,
          externalId: uuidV4(),
          state: PaymentState.WAITING,
          updatedAt: getMoment().toDate(),
        },
      );

      mockGetAllRepository.mockResolvedValue([payment]);

      mockGetPaymentByIdGateway.mockResolvedValue(undefined);

      await sut.execute();

      expect(mockCompletedPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockRevertedPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockTranslateError).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not emit any event when receives an error.', async () => {
      const {
        sut,
        mockCompletedPaymentEvent,
        mockRevertedPaymentEvent,
        mockGetAllRepository,
        mockGetPaymentByIdGateway,
        mockTranslateError,
      } = makeSut();

      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        {
          priorityType: PaymentPriorityType.PRIORITY,
          externalId: uuidV4(),
          state: PaymentState.WAITING,
          updatedAt: getMoment().toDate(),
        },
      );

      mockGetAllRepository.mockResolvedValue([payment]);

      mockGetPaymentByIdGateway.mockResolvedValue(
        GetPaymentByIdPspGatewayMock.offline(),
      );

      await sut.execute();

      expect(mockCompletedPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockRevertedPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockTranslateError).toHaveBeenCalledTimes(0);
    });
  });
});
