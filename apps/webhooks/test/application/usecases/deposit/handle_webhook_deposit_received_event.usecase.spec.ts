import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  WebhookEntity,
  WebhookEventEntity,
  WebhookEventRepository,
  WebhookEventState,
  WebhookRepository,
  WebhookType,
} from '@zro/webhooks/domain';
import { PixDepositEntity, PixDepositState } from '@zro/pix-payments/domain';
import {
  HandleWebhookDepositReceivedEventUseCase as UseCase,
  WebhookTargetGatewayDepositReceivedRequest,
  PixPaymentService,
  WebhookEventEmitter,
} from '@zro/webhooks/application';
import {
  PixDepositNotFoundException,
  PixDepositInvalidStateException,
} from '@zro/pix-payments/application';
import { PixDepositFactory } from '@zro/test/pix-payments/config';

const dateMock = new Date();

describe('HandleDepositReceivedEventUseCase', () => {
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
    const mockGetActivateAndDepositReceivedByAccountAndAgencyRepository: jest.Mock =
      On(webhookRepository).get(
        method((mock) => mock.getActivateAndDepositReceivedByAccountAndAgency),
      );

    return {
      webhookEventRepository,
      mockCreateRepository,
      webhookRepository,
      mockGetActivateAndDepositReceivedByAccountAndAgencyRepository,
    };
  };

  const mockService = () => {
    const pixPaymentService: PixPaymentService =
      createMock<PixPaymentService>();

    const mockGetDepositByIdService: jest.Mock = On(pixPaymentService).get(
      method((mock) => mock.getPixDepositById),
    );

    return {
      pixPaymentService,
      mockGetDepositByIdService,
    };
  };

  const makeSut = () => {
    const {
      webhookEventRepository,
      webhookRepository,
      mockCreateRepository,
      mockGetActivateAndDepositReceivedByAccountAndAgencyRepository,
    } = mockRepository();

    const { eventEmitter, mockCreatedEvent } = mockEmitter();

    const { pixPaymentService, mockGetDepositByIdService } = mockService();

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
      mockGetActivateAndDepositReceivedByAccountAndAgencyRepository,
      mockCreatedEvent,
      mockGetDepositByIdService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw if missing params', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDepositReceivedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetDepositByIdService,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDepositReceivedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetDepositByIdService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw if payment not has id', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDepositReceivedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetDepositByIdService,
      } = makeSut();

      const testScript = () => sut.execute(new PixDepositEntity({}));

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDepositReceivedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetDepositByIdService).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw PixDepositNotFoundException if deposit not found', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDepositReceivedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetDepositByIdService,
      } = makeSut();

      mockGetDepositByIdService.mockReturnValue(null);

      const testScript = () =>
        sut.execute(new PixDepositEntity({ id: 'any-id' }));

      await expect(testScript).rejects.toThrow(PixDepositNotFoundException);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDepositReceivedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetDepositByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetDepositByIdService).toHaveBeenCalledWith('any-id');
    });

    it('TC0004 - Should throw PixDepositInvalidStateException if deposit state not is received', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDepositReceivedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetDepositByIdService,
      } = makeSut();

      mockGetDepositByIdService.mockReturnValue(
        new PixDepositEntity({ state: PixDepositState.ERROR }),
      );

      const testScript = () =>
        sut.execute(new PixDepositEntity({ id: 'any-id' }));

      await expect(testScript).rejects.toThrow(PixDepositInvalidStateException);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDepositReceivedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetDepositByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetDepositByIdService).toHaveBeenCalledWith('any-id');
    });

    it('TC0005 - Should do nothing if Webhook is not found', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDepositReceivedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetDepositByIdService,
      } = makeSut();

      mockGetDepositByIdService.mockReturnValue(
        new PixDepositEntity({
          state: PixDepositState.RECEIVED,
          clientAccountNumber: '1',
          clientBranch: '2',
        }),
      );

      mockGetActivateAndDepositReceivedByAccountAndAgencyRepository.mockReturnValue(
        null,
      );

      const result = await sut.execute(new PixDepositEntity({ id: 'any-id' }));

      expect(result).toBeUndefined();
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDepositReceivedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetActivateAndDepositReceivedByAccountAndAgencyRepository,
      ).toHaveBeenCalledWith('1', '2');
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetDepositByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetDepositByIdService).toHaveBeenCalledWith('any-id');
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should create webhook event', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDepositReceivedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetDepositByIdService,
      } = makeSut();

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        { state: PixDepositState.RECEIVED },
      );

      const targetGatewayPayload: WebhookTargetGatewayDepositReceivedRequest = {
        id: deposit.id,
        endToEndId: deposit.endToEndId,
        txId: deposit.txId,
        amount: deposit.amount,
        operationId: deposit.operation.id,
        thirdPartName: deposit.thirdPartName,
        thirdPartPersonType: deposit.thirdPartPersonType,
        thirdPartDocument: deposit.thirdPartDocument,
        thirdPartAccountNumber: deposit.thirdPartAccountNumber,
        thirdPartBranch: deposit.thirdPartBranch,
        thirdPartBankName: deposit.thirdPartBank.name,
        thirdPartBankIspb: deposit.thirdPartBank.ispb,
        clientName: deposit.clientName,
        clientAccountNumber: deposit.clientAccountNumber,
        clientPersonType: deposit.clientPersonType,
        clientDocument: deposit.clientDocument,
        clientBankName: deposit.clientBank.name,
        clientBankIspb: deposit.clientBank.ispb,
        createdAt: deposit.createdAt,
      };

      const webhook = new WebhookEntity({
        targetUrl: 'target-url',
        apiKey: 'api-key',
      });

      mockGetDepositByIdService.mockReturnValue(deposit);

      mockGetActivateAndDepositReceivedByAccountAndAgencyRepository.mockReturnValue(
        webhook,
      );

      const dateExpected = new Date(dateMock);
      dateExpected.setDate(dateMock.getDate() + 7);

      const result = await sut.execute(deposit);

      expect(result).toBeDefined();
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledWith(
        new WebhookEventEntity({
          state: WebhookEventState.PENDING,
          webhook,
          type: WebhookType.DEPOSIT_RECEIVED,
          accountNumber: webhook.accountNumber,
          agencyNumber: webhook.agencyNumber,
          data: targetGatewayPayload,
          targetUrl: webhook.targetUrl,
          apiKey: webhook.apiKey,
          retryLimit: dateExpected,
        }),
      );
      expect(
        mockGetActivateAndDepositReceivedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetActivateAndDepositReceivedByAccountAndAgencyRepository,
      ).toHaveBeenCalledWith(deposit.clientAccountNumber, deposit.clientBranch);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(1);
      expect(mockGetDepositByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetDepositByIdService).toHaveBeenCalledWith(deposit.id);
    });
  });
});
