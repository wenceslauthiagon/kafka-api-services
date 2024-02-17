import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { BankEntity } from '@zro/banking/domain';
import {
  WebhookEntity,
  WebhookEventEntity,
  WebhookType,
  WebhookEventRepository,
  WebhookRepository,
  WebhookEventState,
} from '@zro/webhooks/domain';
import {
  PixDevolutionReceivedState,
  PixDevolutionReceivedEntity,
} from '@zro/pix-payments/domain';
import {
  HandleWebhookDevolutionReceivedEventUseCase as UseCase,
  WebhookTargetGatewayPixDevolutionReceivedRequest,
  PixPaymentService,
  WebhookEventEmitter,
} from '@zro/webhooks/application';
import {
  PixDevolutionReceivedNotFoundException,
  PixDevolutionReceivedInvalidStateException,
} from '@zro/pix-payments/application';
import { PixDevolutionReceivedFactory } from '@zro/test/pix-payments/config';
import { BankFactory } from '@zro/test/banking/config';

const dateMock = new Date();

describe('HandleDevolutionReceivedEventUseCase', () => {
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
    const mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository: jest.Mock =
      On(webhookRepository).get(
        method(
          (mock) => mock.getActivateAndDevolutionReceivedByAccountAndAgency,
        ),
      );

    return {
      webhookEventRepository,
      webhookRepository,
      mockCreateRepository,
      mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository,
    };
  };

  const mockService = () => {
    const pixPaymentService: PixPaymentService =
      createMock<PixPaymentService>();

    const mockGetPixDevolutionReceivedById: jest.Mock = On(
      pixPaymentService,
    ).get(method((mock) => mock.getDevolutionReceivedById));

    return {
      pixPaymentService,
      mockGetPixDevolutionReceivedById,
    };
  };

  const makeSut = () => {
    const {
      webhookEventRepository,
      mockCreateRepository,
      webhookRepository,
      mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository,
    } = mockRepository();

    const { eventEmitter, mockCreatedEvent } = mockEmitter();

    const { pixPaymentService, mockGetPixDevolutionReceivedById } =
      mockService();

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
      mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository,
      mockCreatedEvent,
      mockGetPixDevolutionReceivedById,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw if missing params', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetPixDevolutionReceivedById,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPixDevolutionReceivedById).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw if devolution received not has id', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetPixDevolutionReceivedById,
      } = makeSut();

      const testScript = () => sut.execute(new PixDevolutionReceivedEntity({}));

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPixDevolutionReceivedById).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw PixDevolutionReceivedNotFoundException if devolution received not found', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetPixDevolutionReceivedById,
      } = makeSut();

      mockGetPixDevolutionReceivedById.mockReturnValue(null);

      const testScript = () =>
        sut.execute(new PixDevolutionReceivedEntity({ id: 'any-id' }));

      await expect(testScript).rejects.toThrow(
        PixDevolutionReceivedNotFoundException,
      );
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPixDevolutionReceivedById).toHaveBeenCalledTimes(1);
      expect(mockGetPixDevolutionReceivedById).toHaveBeenCalledWith('any-id');
    });

    it('TC0004 - Should throw PixDevolutionReceivedInvalidStateException if payment state not is confirmed', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetPixDevolutionReceivedById,
      } = makeSut();

      const pixDevolutionReceived =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
          { state: PixDevolutionReceivedState.ERROR },
        );

      mockGetPixDevolutionReceivedById.mockReturnValue(pixDevolutionReceived);

      const testScript = () =>
        sut.execute(new PixDevolutionReceivedEntity({ id: 'any-id' }));

      await expect(testScript).rejects.toThrow(
        PixDevolutionReceivedInvalidStateException,
      );
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPixDevolutionReceivedById).toHaveBeenCalledTimes(1);
      expect(mockGetPixDevolutionReceivedById).toHaveBeenCalledWith('any-id');
    });

    it('TC0005 - Should do nothing if Webhook is not found', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetPixDevolutionReceivedById,
      } = makeSut();

      const pixDevolutionReceived =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
          {
            state: PixDevolutionReceivedState.READY,
            clientAccountNumber: '1',
            clientBranch: '2',
          },
        );

      mockGetPixDevolutionReceivedById.mockReturnValue(pixDevolutionReceived);

      mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository.mockReturnValue(
        null,
      );

      const result = await sut.execute(
        new PixDevolutionReceivedEntity({ id: 'any-id' }),
      );

      expect(result).toBeUndefined();
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository,
      ).toHaveBeenCalledWith('1', '2');
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPixDevolutionReceivedById).toHaveBeenCalledTimes(1);
      expect(mockGetPixDevolutionReceivedById).toHaveBeenCalledWith('any-id');
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should create webhook event', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetPixDevolutionReceivedById,
      } = makeSut();

      const clientBank = await BankFactory.create<BankEntity>(BankEntity.name);

      const pixDevolutionReceived =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
          {
            state: PixDevolutionReceivedState.READY,
            clientAccountNumber: '1',
            clientBranch: '2',
            clientBank,
          },
        );

      const targetGatewayPayload: WebhookTargetGatewayPixDevolutionReceivedRequest =
        {
          id: pixDevolutionReceived.id,
          endToEndId: pixDevolutionReceived.endToEndId,
          txId: pixDevolutionReceived.txId,
          amount: pixDevolutionReceived.amount,
          operationId: pixDevolutionReceived.operation.id,
          thirdPartName: pixDevolutionReceived.thirdPartName,
          thirdPartPersonType: pixDevolutionReceived.thirdPartPersonType,
          thirdPartDocument: pixDevolutionReceived.thirdPartDocument,
          thirdPartAccountNumber: pixDevolutionReceived.thirdPartAccountNumber,
          thirdPartBranch: pixDevolutionReceived.thirdPartBranch,
          thirdPartBankName: pixDevolutionReceived.thirdPartBank.name,
          thirdPartBankIspb: pixDevolutionReceived.thirdPartBank.ispb,
          clientName: pixDevolutionReceived.clientName,
          clientPersonType: pixDevolutionReceived.clientPersonType,
          clientDocument: pixDevolutionReceived.clientDocument,
          clientBankName: clientBank.name,
          clientBankIspb: clientBank.ispb,
          createdAt: pixDevolutionReceived.createdAt,
        };

      const webhook = new WebhookEntity({
        targetUrl: 'target-url',
        apiKey: 'api-key',
      });

      mockGetPixDevolutionReceivedById.mockReturnValue(pixDevolutionReceived);

      mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository.mockReturnValue(
        webhook,
      );

      const dateExpected = new Date(dateMock);
      dateExpected.setDate(dateMock.getDate() + 7);

      const result = await sut.execute(pixDevolutionReceived);

      expect(result).toBeDefined();
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledWith(
        new WebhookEventEntity({
          state: WebhookEventState.PENDING,
          webhook,
          type: WebhookType.DEVOLUTION_RECEIVED,
          accountNumber: webhook.accountNumber,
          agencyNumber: webhook.agencyNumber,
          data: targetGatewayPayload,
          targetUrl: webhook.targetUrl,
          apiKey: webhook.apiKey,
          retryLimit: dateExpected,
        }),
      );
      expect(
        mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetActivateAndDevolutionReceivedByAccountAndAgencyRepository,
      ).toHaveBeenCalledWith(
        pixDevolutionReceived.clientAccountNumber,
        pixDevolutionReceived.clientBranch,
      );
      expect(mockCreatedEvent).toHaveBeenCalledTimes(1);
      expect(mockGetPixDevolutionReceivedById).toHaveBeenCalledTimes(1);
      expect(mockGetPixDevolutionReceivedById).toHaveBeenCalledWith(
        pixDevolutionReceived.id,
      );
    });
  });
});
