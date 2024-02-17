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
import {
  PixDevolutionEntity,
  PixDevolutionState,
  PixDepositEntity,
} from '@zro/pix-payments/domain';
import {
  PixPaymentService,
  WebhookEventEmitter,
  HandleWebhookDevolutionFailedEventUseCase as UseCase,
  WebhookTargetGatewayPixDevolutionFailedRequest,
} from '@zro/webhooks/application';
import {
  PixDevolutionNotFoundException,
  PixDevolutionInvalidStateException,
} from '@zro/pix-payments/application';
import {
  PixDevolutionFactory,
  PixDepositFactory,
} from '@zro/test/pix-payments/config';

const dateMock = new Date();

describe('HandleWebhookDevolutionFailedEventUseCase', () => {
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
    const mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository: jest.Mock =
      On(webhookRepository).get(
        method((mock) => mock.getActivateAndDevolutionFailedByAccountAndAgency),
      );

    return {
      webhookEventRepository,
      webhookRepository,
      mockCreateRepository,
      mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository,
    };
  };

  const mockService = () => {
    const pixDevolutionService: PixPaymentService =
      createMock<PixPaymentService>();

    const mockGetDevolutionByIdService: jest.Mock = On(
      pixDevolutionService,
    ).get(method((mock) => mock.getDevolutionById));

    const mockGetDepositByIdService: jest.Mock = On(pixDevolutionService).get(
      method((mock) => mock.getPixDepositById),
    );

    return {
      pixDevolutionService,
      mockGetDevolutionByIdService,
      mockGetDepositByIdService,
    };
  };

  const makeSut = () => {
    const {
      webhookEventRepository,
      mockCreateRepository,
      webhookRepository,
      mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository,
    } = mockRepository();

    const { eventEmitter, mockCreatedEvent } = mockEmitter();

    Date.now = jest.fn().mockReturnValue(dateMock);

    const {
      pixDevolutionService,
      mockGetDevolutionByIdService,
      mockGetDepositByIdService,
    } = mockService();

    const sut = new UseCase(
      logger,
      webhookRepository,
      webhookEventRepository,
      pixDevolutionService,
      eventEmitter,
    );

    return {
      sut,
      mockCreateRepository,
      mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository,
      mockCreatedEvent,
      mockGetDevolutionByIdService,
      mockGetDepositByIdService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw if missing params', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetDevolutionByIdService,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw if devolution not has id', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetDevolutionByIdService,
      } = makeSut();

      const testScript = () => sut.execute(new PixDevolutionEntity({}));

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw PixDevolutionNotFoundException if devolution not found', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetDevolutionByIdService,
      } = makeSut();

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
      );

      mockGetDevolutionByIdService.mockReturnValue(null);

      const testScript = () =>
        sut.execute(new PixDevolutionEntity({ id: devolution.id }));

      await expect(testScript).rejects.toThrow(PixDevolutionNotFoundException);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledWith(devolution.id);
    });

    it('TC0004 - Should throw PixDevolutionInvalidStateException if devolution state not is failed', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetDevolutionByIdService,
      } = makeSut();

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
      );

      mockGetDevolutionByIdService.mockReturnValue(
        new PixDevolutionEntity({ state: PixDevolutionState.PENDING }),
      );

      const testScript = () => sut.execute(devolution);

      await expect(testScript).rejects.toThrow(
        PixDevolutionInvalidStateException,
      );
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledWith(devolution.id);
    });

    it('TC0005 - Should do nothing if Webhook is not found', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetDevolutionByIdService,
        mockGetDepositByIdService,
      } = makeSut();

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        { clientAccountNumber: '1', clientBranch: '2' },
      );

      mockGetDepositByIdService.mockResolvedValue(deposit);

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
        { state: PixDevolutionState.FAILED },
      );

      mockGetDevolutionByIdService.mockReturnValue(devolution);

      mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository.mockReturnValue(
        null,
      );

      const result = await sut.execute(devolution);

      expect(result).toBeUndefined();
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledWith(devolution.id);
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should create webhook event', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetDevolutionByIdService,
        mockGetDepositByIdService,
      } = makeSut();

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        { clientAccountNumber: '1', clientBranch: '2' },
      );

      mockGetDepositByIdService.mockResolvedValue(deposit);

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
        {
          state: PixDevolutionState.FAILED,
          failed: {
            code: 'error-code',
            message: 'error-message',
          },
        },
      );

      const webhookTargetPayload: WebhookTargetGatewayPixDevolutionFailedRequest =
        {
          id: devolution.id,
          endToEndId: devolution.endToEndId,
          txId: deposit.txId,
          amount: devolution.amount,
          clientName: deposit.clientName,
          operationId: devolution.operation?.id,
          clientPersonType: deposit.clientPersonType,
          clientDocument: deposit.clientDocument,
          clientAccountNumber: deposit.clientAccountNumber,
          clientBranch: deposit.clientBranch,
          clientBankName: deposit.clientBank?.name,
          clientBankIspb: deposit.clientBank?.ispb,
          thirdPartName: deposit.thirdPartName,
          thirdPartPersonType: deposit.thirdPartPersonType,
          thirdPartDocument: deposit.thirdPartDocument,
          thirdPartBankName: deposit.thirdPartBank?.name,
          thirdPartBankIspb: deposit.thirdPartBank?.ispb,
          errorCode: devolution?.failed?.code,
          errorDescription: devolution?.failed?.message,
          createdAt: devolution.createdAt,
        };

      const webhook = new WebhookEntity({
        targetUrl: 'target-url',
        apiKey: 'api-key',
      });

      mockGetDevolutionByIdService.mockReturnValue(devolution);

      mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository.mockReturnValue(
        webhook,
      );

      const dateExpected = new Date(dateMock);
      dateExpected.setDate(dateMock.getDate() + 7);

      const result = await sut.execute(devolution);

      expect(result).toBeDefined();
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledWith(
        new WebhookEventEntity({
          state: WebhookEventState.PENDING,
          webhook,
          type: WebhookType.DEVOLUTION_FAILED,
          accountNumber: webhook.accountNumber,
          agencyNumber: webhook.agencyNumber,
          data: webhookTargetPayload,
          targetUrl: webhook.targetUrl,
          apiKey: webhook.apiKey,
          retryLimit: dateExpected,
        }),
      );
      expect(
        mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetActivateAndDevolutionFailedByAccountAndAgencyRepository,
      ).toHaveBeenCalledWith(deposit.clientAccountNumber, deposit.clientBranch);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(1);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledWith(devolution.id);
    });
  });
});
