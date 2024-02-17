import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { PaymentEntity, PaymentState } from '@zro/pix-payments/domain';
import {
  WebhookEntity,
  WebhookEventEntity,
  WebhookEventRepository,
  WebhookEventState,
  WebhookRepository,
  WebhookType,
} from '@zro/webhooks/domain';
import {
  HandleWebhookPaymentFailedEventUseCase as UseCase,
  PixPaymentService,
  WebhookEventEmitter,
  WebhookTargetGatewayPaymentFailedRequest,
} from '@zro/webhooks/application';
import {
  PaymentNotFoundException,
  PaymentInvalidStateException,
} from '@zro/pix-payments/application';
import { PaymentFactory } from '@zro/test/pix-payments/config';

const dateMock = new Date();

describe('HandleWebhookPaymentFailedEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockEmitter = () => {
    const eventEmitter: WebhookEventEmitter = createMock<WebhookEventEmitter>();

    const mockCreatedEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.created),
    );

    return {
      eventEmitter,
      mockCreatedEvent,
    };
  };

  const mockRepository = () => {
    const webhookEventRepository: WebhookEventRepository =
      createMock<WebhookEventRepository>();
    const mockCreateRepository: jest.Mock = On(webhookEventRepository).get(
      method((mock) => mock.create),
    );

    const webhookRepository: WebhookRepository =
      createMock<WebhookRepository>();
    const mockGetActivateAndPaymentFailedByAccountAndAgencyRepository: jest.Mock =
      On(webhookRepository).get(
        method((mock) => mock.getActivateAndPaymentFailedByAccountAndAgency),
      );

    return {
      webhookEventRepository,
      mockCreateRepository,
      webhookRepository,
      mockGetActivateAndPaymentFailedByAccountAndAgencyRepository,
    };
  };

  const mockService = () => {
    const pixPaymentService: PixPaymentService =
      createMock<PixPaymentService>();

    const mockGetByIdService: jest.Mock = On(pixPaymentService).get(
      method((mock) => mock.getById),
    );

    return {
      pixPaymentService,
      mockGetByIdService,
    };
  };

  const makeSut = () => {
    const {
      webhookEventRepository,
      mockCreateRepository,
      webhookRepository,
      mockGetActivateAndPaymentFailedByAccountAndAgencyRepository,
    } = mockRepository();

    const { eventEmitter, mockCreatedEvent } = mockEmitter();

    const { pixPaymentService, mockGetByIdService } = mockService();

    Date.now = jest.fn().mockReturnValue(dateMock);

    const sut = new UseCase(
      logger,
      webhookRepository,
      webhookEventRepository,
      pixPaymentService,
      eventEmitter,
    );

    return {
      sut,
      mockCreateRepository,
      mockGetActivateAndPaymentFailedByAccountAndAgencyRepository,
      mockCreatedEvent,
      mockGetByIdService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw if missing params', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndPaymentFailedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetByIdService,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndPaymentFailedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw if payment not has id', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndPaymentFailedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetByIdService,
      } = makeSut();

      const testScript = () => sut.execute(new PaymentEntity({}));

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndPaymentFailedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdService).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw PixPaymentnotFoundException if payment not found', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndPaymentFailedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetByIdService,
      } = makeSut();

      mockGetByIdService.mockReturnValue(null);

      const testScript = () => sut.execute(new PaymentEntity({ id: 'any-id' }));

      await expect(testScript).rejects.toThrow(PaymentNotFoundException);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndPaymentFailedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetByIdService).toHaveBeenCalledWith('any-id');
    });

    it('TC0004 - Should throw PixPaymentInvalidStateException if payment state not is failed', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndPaymentFailedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetByIdService,
      } = makeSut();

      mockGetByIdService.mockReturnValue(
        new PaymentEntity({ state: PaymentState.PENDING }),
      );

      const testScript = () => sut.execute(new PaymentEntity({ id: 'any-id' }));

      await expect(testScript).rejects.toThrow(PaymentInvalidStateException);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndPaymentFailedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetByIdService).toHaveBeenCalledWith('any-id');
    });

    it('TC0005 - Should do nothing if Webhook is not found', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndPaymentFailedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetByIdService,
      } = makeSut();

      mockGetByIdService.mockReturnValue(
        new PaymentEntity({
          state: PaymentState.FAILED,
          ownerAccountNumber: '1',
          ownerBranch: '2',
        }),
      );

      mockGetActivateAndPaymentFailedByAccountAndAgencyRepository.mockReturnValue(
        null,
      );

      const result = await sut.execute(new PaymentEntity({ id: 'any-id' }));

      expect(result).toBeUndefined();
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndPaymentFailedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetActivateAndPaymentFailedByAccountAndAgencyRepository,
      ).toHaveBeenCalledWith('1', '2');
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetByIdService).toHaveBeenCalledWith('any-id');
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should create webhook event', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndPaymentFailedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetByIdService,
      } = makeSut();

      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        {
          state: PaymentState.FAILED,
          failed: {
            code: 'error-code',
            message: 'error-message',
          },
        },
      );

      const targetGatewayPayload: WebhookTargetGatewayPaymentFailedRequest = {
        id: payment.id,
        endToEndId: payment.endToEndId,
        txId: payment.txId,
        value: payment.value,
        operationId: payment.operation.id,
        ownerFullName: payment.ownerFullName,
        ownerPersonType: payment.ownerPersonType,
        ownerDocument: payment.ownerDocument,
        ownerAccountNumber: payment.ownerAccountNumber,
        ownerBranch: payment.ownerBranch,
        beneficiaryName: payment.beneficiaryName,
        beneficiaryPersonType: payment.beneficiaryPersonType,
        beneficiaryDocument: payment.beneficiaryDocument,
        beneficiaryBankName: payment.beneficiaryBankName,
        beneficiaryBankIspb: payment.beneficiaryBankIspb,
        errorCode: payment?.failed?.code,
        errorDescription: payment?.failed?.message,
        createdAt: payment.createdAt,
      };

      const webhook = new WebhookEntity({
        targetUrl: 'target-url',
        apiKey: 'api-key',
      });

      mockGetByIdService.mockReturnValue(payment);

      mockGetActivateAndPaymentFailedByAccountAndAgencyRepository.mockReturnValue(
        webhook,
      );

      const dateExpected = new Date(dateMock);
      dateExpected.setDate(dateMock.getDate() + 7);

      const result = await sut.execute(payment);

      expect(result).toBeDefined();
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledWith(
        new WebhookEventEntity({
          state: WebhookEventState.PENDING,
          webhook,
          type: WebhookType.PAYMENT_FAILED,
          accountNumber: webhook.accountNumber,
          agencyNumber: webhook.agencyNumber,
          data: targetGatewayPayload,
          targetUrl: webhook.targetUrl,
          apiKey: webhook.apiKey,
          retryLimit: dateExpected,
        }),
      );
      expect(
        mockGetActivateAndPaymentFailedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetActivateAndPaymentFailedByAccountAndAgencyRepository,
      ).toHaveBeenCalledWith(payment.ownerAccountNumber, payment.ownerBranch);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(1);
      expect(mockGetByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetByIdService).toHaveBeenCalledWith(payment.id);
    });
  });
});
