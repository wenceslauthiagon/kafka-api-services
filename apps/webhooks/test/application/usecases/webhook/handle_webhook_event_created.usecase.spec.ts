import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  WebhookEventEntity,
  WebhookEventRepository,
  WebhookEventState,
  WebhookType,
} from '@zro/webhooks/domain';
import {
  HandleWebhookEventCreatedUseCase as UseCase,
  WebhookTargetGateway,
  WebhookEventEmitter,
  EncryptProvider,
} from '@zro/webhooks/application';
import { WebhookEventFactory } from '@zro/test/webhooks/config';

describe('HandleWebhookEventCreatedUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockEmitter = () => {
    const eventEmitter: WebhookEventEmitter = createMock<WebhookEventEmitter>();

    const mockConfirmedEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.confirmed),
    );

    return {
      eventEmitter,
      mockConfirmedEvent,
    };
  };

  const mockRepository = () => {
    const webhookEventRepository: WebhookEventRepository =
      createMock<WebhookEventRepository>();

    const mockGetById: jest.Mock = On(webhookEventRepository).get(
      method((mock) => mock.getById),
    );

    const mockUpdate: jest.Mock = On(webhookEventRepository).get(
      method((mock) => mock.update),
    );

    return {
      webhookEventRepository,
      mockGetById,
      mockUpdate,
    };
  };

  const mockEncryptProvider = () => {
    const encryptProvider: EncryptProvider = createMock<EncryptProvider>();

    const mockDecrypt: jest.Mock = On(encryptProvider).get(
      method((mock) => mock.decrypt),
    );

    return {
      encryptProvider,
      mockDecrypt,
    };
  };

  const mockGateway = () => {
    const webhookTargetGateway: WebhookTargetGateway =
      createMock<WebhookTargetGateway>();

    const mockSendPayment: jest.Mock = On(webhookTargetGateway).get(
      method((mock) => mock.sendPaymentCompleted),
    );

    const mockSendDeposit: jest.Mock = On(webhookTargetGateway).get(
      method((mock) => mock.sendDepositReceived),
    );

    const mockSendDevolution: jest.Mock = On(webhookTargetGateway).get(
      method((mock) => mock.sendDevolutionReceived),
    );

    const mockSendDevolutionCompleted: jest.Mock = On(webhookTargetGateway).get(
      method((mock) => mock.sendDevolutionCompleted),
    );

    const mockSendPaymentFailed: jest.Mock = On(webhookTargetGateway).get(
      method((mock) => mock.sendPaymentFailed),
    );

    const mockSendDevolutionFailed: jest.Mock = On(webhookTargetGateway).get(
      method((mock) => mock.sendDevolutionFailed),
    );

    return {
      webhookTargetGateway,
      mockSendPayment,
      mockSendDeposit,
      mockSendDevolution,
      mockSendDevolutionCompleted,
      mockSendPaymentFailed,
      mockSendDevolutionFailed,
    };
  };

  const makeSut = () => {
    const { webhookEventRepository, mockGetById, mockUpdate } =
      mockRepository();

    const { eventEmitter, mockConfirmedEvent } = mockEmitter();

    const { encryptProvider, mockDecrypt } = mockEncryptProvider();

    const {
      webhookTargetGateway,
      mockSendDeposit,
      mockSendDevolution,
      mockSendPayment,
      mockSendDevolutionCompleted,
      mockSendPaymentFailed,
      mockSendDevolutionFailed,
    } = mockGateway();

    const sut = new UseCase(
      logger,
      webhookEventRepository,
      webhookTargetGateway,
      encryptProvider,
      eventEmitter,
    );

    return {
      sut,
      mockGetById,
      mockUpdate,
      mockConfirmedEvent,
      mockDecrypt,
      mockSendDeposit,
      mockSendDevolution,
      mockSendPayment,
      mockSendDevolutionCompleted,
      mockSendPaymentFailed,
      mockSendDevolutionFailed,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw if missing webhook event', async () => {
      const {
        sut,
        mockGetById,
        mockUpdate,
        mockConfirmedEvent,
        mockDecrypt,
        mockSendDeposit,
        mockSendDevolution,
        mockSendPayment,
        mockSendPaymentFailed,
        mockSendDevolutionFailed,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetById).toHaveBeenCalledTimes(0);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockConfirmedEvent).toHaveBeenCalledTimes(0);
      expect(mockDecrypt).toHaveBeenCalledTimes(0);
      expect(mockSendDeposit).toHaveBeenCalledTimes(0);
      expect(mockSendDevolution).toHaveBeenCalledTimes(0);
      expect(mockSendPayment).toHaveBeenCalledTimes(0);
      expect(mockSendPaymentFailed).toHaveBeenCalledTimes(0);
      expect(mockSendDevolutionFailed).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw if webhook event not has id', async () => {
      const {
        sut,
        mockGetById,
        mockUpdate,
        mockConfirmedEvent,
        mockDecrypt,
        mockSendDeposit,
        mockSendDevolution,
        mockSendPayment,
        mockSendPaymentFailed,
        mockSendDevolutionFailed,
      } = makeSut();

      const testScript = () => sut.execute(new WebhookEventEntity({}));

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetById).toHaveBeenCalledTimes(0);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockConfirmedEvent).toHaveBeenCalledTimes(0);
      expect(mockDecrypt).toHaveBeenCalledTimes(0);
      expect(mockSendDeposit).toHaveBeenCalledTimes(0);
      expect(mockSendDevolution).toHaveBeenCalledTimes(0);
      expect(mockSendPayment).toHaveBeenCalledTimes(0);
      expect(mockSendPaymentFailed).toHaveBeenCalledTimes(0);
      expect(mockSendDevolutionFailed).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should send payment completed if webhook event is of type payment', async () => {
      const {
        sut,
        mockGetById,
        mockUpdate,
        mockConfirmedEvent,
        mockDecrypt,
        mockSendDeposit,
        mockSendDevolution,
        mockSendPayment,
        mockSendPaymentFailed,
        mockSendDevolutionFailed,
      } = makeSut();

      const webhookEvent = await WebhookEventFactory.create<WebhookEventEntity>(
        WebhookEventEntity.name,
        {
          state: WebhookEventState.PENDING,
          type: WebhookType.PAYMENT_COMPLETED,
        },
      );

      const httpStatusCodeResponse = '200';

      const webhookEventUpdated = {
        ...webhookEvent,
        state: WebhookEventState.CONFIRMED,
        httpStatusCodeResponse,
      };

      const targeUrlDecrypted = 'target-url-decrypted';
      const apiKeyDecrypted = 'api-key-decrypted';

      mockGetById.mockResolvedValue(webhookEvent);

      mockDecrypt.mockReturnValueOnce(targeUrlDecrypted);
      mockDecrypt.mockReturnValueOnce(apiKeyDecrypted);

      mockSendPayment.mockResolvedValue({ httpStatusCodeResponse });

      mockUpdate.mockResolvedValue(webhookEventUpdated);

      const result = await sut.execute(webhookEvent);

      expect(result).toBeDefined();
      expect(mockGetById).toHaveBeenCalledTimes(1);
      expect(mockGetById).toHaveBeenCalledWith(webhookEvent.id);
      expect(mockDecrypt).toHaveBeenCalledTimes(2);
      expect(mockDecrypt).toHaveBeenNthCalledWith(1, webhookEvent.targetUrl);
      expect(mockDecrypt).toHaveBeenNthCalledWith(2, webhookEvent.apiKey);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith(webhookEventUpdated);
      expect(mockConfirmedEvent).toHaveBeenCalledTimes(1);
      expect(mockConfirmedEvent).toHaveBeenCalledWith(webhookEventUpdated);
      expect(mockSendDeposit).toHaveBeenCalledTimes(0);
      expect(mockSendDevolution).toHaveBeenCalledTimes(0);
      expect(mockSendPaymentFailed).toHaveBeenCalledTimes(0);
      expect(mockSendDevolutionFailed).toHaveBeenCalledTimes(0);
      expect(mockSendPayment).toHaveBeenCalledTimes(1);
      expect(mockSendPayment).toHaveBeenCalledWith(
        targeUrlDecrypted,
        apiKeyDecrypted,
        webhookEvent.data,
      );
    });

    it('TC0004 - Should send deposit received if webhook event is of type deposit received', async () => {
      const {
        sut,
        mockGetById,
        mockUpdate,
        mockConfirmedEvent,
        mockDecrypt,
        mockSendDeposit,
        mockSendDevolution,
        mockSendPayment,
        mockSendPaymentFailed,
        mockSendDevolutionFailed,
      } = makeSut();

      const webhookEvent = await WebhookEventFactory.create<WebhookEventEntity>(
        WebhookEventEntity.name,
        {
          state: WebhookEventState.PENDING,
          type: WebhookType.DEPOSIT_RECEIVED,
        },
      );

      const httpStatusCodeResponse = '200';

      const webhookEventUpdated = {
        ...webhookEvent,
        state: WebhookEventState.CONFIRMED,
        httpStatusCodeResponse,
      };

      const targeUrlDecrypted = 'target-url-decrypted';
      const apiKeyDecrypted = 'api-key-decrypted';

      mockGetById.mockResolvedValue(webhookEvent);

      mockDecrypt.mockReturnValueOnce(targeUrlDecrypted);
      mockDecrypt.mockReturnValueOnce(apiKeyDecrypted);

      mockSendDeposit.mockResolvedValue({ httpStatusCodeResponse });

      mockUpdate.mockResolvedValue(webhookEventUpdated);

      const result = await sut.execute(webhookEvent);

      expect(result).toBeDefined();
      expect(mockGetById).toHaveBeenCalledTimes(1);
      expect(mockGetById).toHaveBeenCalledWith(webhookEvent.id);
      expect(mockDecrypt).toHaveBeenCalledTimes(2);
      expect(mockDecrypt).toHaveBeenNthCalledWith(1, webhookEvent.targetUrl);
      expect(mockDecrypt).toHaveBeenNthCalledWith(2, webhookEvent.apiKey);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith(webhookEventUpdated);
      expect(mockConfirmedEvent).toHaveBeenCalledTimes(1);
      expect(mockConfirmedEvent).toHaveBeenCalledWith(webhookEventUpdated);
      expect(mockSendPayment).toHaveBeenCalledTimes(0);
      expect(mockSendDevolution).toHaveBeenCalledTimes(0);
      expect(mockSendPaymentFailed).toHaveBeenCalledTimes(0);
      expect(mockSendDevolutionFailed).toHaveBeenCalledTimes(0);
      expect(mockSendDeposit).toHaveBeenCalledTimes(1);
      expect(mockSendDeposit).toHaveBeenCalledWith(
        targeUrlDecrypted,
        apiKeyDecrypted,
        webhookEvent.data,
      );
    });

    it('TC0005 - Should send devolution received if webhook event is of type devolution received', async () => {
      const {
        sut,
        mockGetById,
        mockUpdate,
        mockConfirmedEvent,
        mockDecrypt,
        mockSendDeposit,
        mockSendDevolution,
        mockSendPayment,
        mockSendPaymentFailed,
        mockSendDevolutionFailed,
      } = makeSut();

      const webhookEvent = await WebhookEventFactory.create<WebhookEventEntity>(
        WebhookEventEntity.name,
        {
          state: WebhookEventState.PENDING,
          type: WebhookType.DEVOLUTION_RECEIVED,
        },
      );

      const httpStatusCodeResponse = '200';

      const webhookEventUpdated = {
        ...webhookEvent,
        state: WebhookEventState.CONFIRMED,
        httpStatusCodeResponse,
      };

      const targeUrlDecrypted = 'target-url-decrypted';
      const apiKeyDecrypted = 'api-key-decrypted';

      mockGetById.mockResolvedValue(webhookEvent);

      mockDecrypt.mockReturnValueOnce(targeUrlDecrypted);
      mockDecrypt.mockReturnValueOnce(apiKeyDecrypted);

      mockSendDevolution.mockResolvedValue({ httpStatusCodeResponse });

      mockUpdate.mockResolvedValue(webhookEventUpdated);

      const result = await sut.execute(webhookEvent);

      expect(result).toBeDefined();
      expect(mockGetById).toHaveBeenCalledTimes(1);
      expect(mockGetById).toHaveBeenCalledWith(webhookEvent.id);
      expect(mockDecrypt).toHaveBeenCalledTimes(2);
      expect(mockDecrypt).toHaveBeenNthCalledWith(1, webhookEvent.targetUrl);
      expect(mockDecrypt).toHaveBeenNthCalledWith(2, webhookEvent.apiKey);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith(webhookEventUpdated);
      expect(mockConfirmedEvent).toHaveBeenCalledTimes(1);
      expect(mockConfirmedEvent).toHaveBeenCalledWith(webhookEventUpdated);
      expect(mockSendPayment).toHaveBeenCalledTimes(0);
      expect(mockSendDeposit).toHaveBeenCalledTimes(0);
      expect(mockSendPaymentFailed).toHaveBeenCalledTimes(0);
      expect(mockSendDevolutionFailed).toHaveBeenCalledTimes(0);
      expect(mockSendDevolution).toHaveBeenCalledTimes(1);
      expect(mockSendDevolution).toHaveBeenCalledWith(
        targeUrlDecrypted,
        apiKeyDecrypted,
        webhookEvent.data,
      );
    });

    it('TC0006 - Should send devolution completed if webhook event is of type devolution completed', async () => {
      const {
        sut,
        mockGetById,
        mockUpdate,
        mockConfirmedEvent,
        mockDecrypt,
        mockSendDeposit,
        mockSendDevolution,
        mockSendPayment,
        mockSendDevolutionCompleted,
        mockSendPaymentFailed,
        mockSendDevolutionFailed,
      } = makeSut();

      const webhookEvent = await WebhookEventFactory.create<WebhookEventEntity>(
        WebhookEventEntity.name,
        {
          state: WebhookEventState.PENDING,
          type: WebhookType.DEVOLUTION_COMPLETED,
        },
      );

      const httpStatusCodeResponse = '200';

      const webhookEventUpdated = {
        ...webhookEvent,
        state: WebhookEventState.CONFIRMED,
        httpStatusCodeResponse,
      };

      const targeUrlDecrypted = 'target-url-decrypted';
      const apiKeyDecrypted = 'api-key-decrypted';

      mockGetById.mockResolvedValue(webhookEvent);

      mockDecrypt.mockReturnValueOnce(targeUrlDecrypted);
      mockDecrypt.mockReturnValueOnce(apiKeyDecrypted);

      mockSendDevolutionCompleted.mockResolvedValue({ httpStatusCodeResponse });

      mockUpdate.mockResolvedValue(webhookEventUpdated);

      const result = await sut.execute(webhookEvent);

      expect(result).toBeDefined();
      expect(mockGetById).toHaveBeenCalledTimes(1);
      expect(mockGetById).toHaveBeenCalledWith(webhookEvent.id);
      expect(mockDecrypt).toHaveBeenCalledTimes(2);
      expect(mockDecrypt).toHaveBeenNthCalledWith(1, webhookEvent.targetUrl);
      expect(mockDecrypt).toHaveBeenNthCalledWith(2, webhookEvent.apiKey);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith(webhookEventUpdated);
      expect(mockConfirmedEvent).toHaveBeenCalledTimes(1);
      expect(mockConfirmedEvent).toHaveBeenCalledWith(webhookEventUpdated);
      expect(mockSendPayment).toHaveBeenCalledTimes(0);
      expect(mockSendDeposit).toHaveBeenCalledTimes(0);
      expect(mockSendDevolution).toHaveBeenCalledTimes(0);
      expect(mockSendPaymentFailed).toHaveBeenCalledTimes(0);
      expect(mockSendDevolutionFailed).toHaveBeenCalledTimes(0);
      expect(mockSendDevolutionCompleted).toHaveBeenCalledTimes(1);
      expect(mockSendDevolutionCompleted).toHaveBeenCalledWith(
        targeUrlDecrypted,
        apiKeyDecrypted,
        webhookEvent.data,
      );
    });

    it('TC0007 - Should send payment failed if webhook event is of type payment failed', async () => {
      const {
        sut,
        mockGetById,
        mockUpdate,
        mockConfirmedEvent,
        mockDecrypt,
        mockSendDeposit,
        mockSendDevolution,
        mockSendPayment,
        mockSendPaymentFailed,
        mockSendDevolutionFailed,
      } = makeSut();

      const webhookEvent = await WebhookEventFactory.create<WebhookEventEntity>(
        WebhookEventEntity.name,
        {
          state: WebhookEventState.PENDING,
          type: WebhookType.PAYMENT_FAILED,
        },
      );

      const httpStatusCodeResponse = '200';

      const webhookEventUpdated = {
        ...webhookEvent,
        state: WebhookEventState.CONFIRMED,
        httpStatusCodeResponse,
      };

      const targeUrlDecrypted = 'target-url-decrypted';
      const apiKeyDecrypted = 'api-key-decrypted';

      mockGetById.mockResolvedValue(webhookEvent);

      mockDecrypt.mockReturnValueOnce(targeUrlDecrypted);
      mockDecrypt.mockReturnValueOnce(apiKeyDecrypted);

      mockSendPaymentFailed.mockResolvedValue({ httpStatusCodeResponse });

      mockUpdate.mockResolvedValue(webhookEventUpdated);

      const result = await sut.execute(webhookEvent);

      expect(result).toBeDefined();
      expect(mockGetById).toHaveBeenCalledTimes(1);
      expect(mockGetById).toHaveBeenCalledWith(webhookEvent.id);
      expect(mockDecrypt).toHaveBeenCalledTimes(2);
      expect(mockDecrypt).toHaveBeenNthCalledWith(1, webhookEvent.targetUrl);
      expect(mockDecrypt).toHaveBeenNthCalledWith(2, webhookEvent.apiKey);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith(webhookEventUpdated);
      expect(mockConfirmedEvent).toHaveBeenCalledTimes(1);
      expect(mockConfirmedEvent).toHaveBeenCalledWith(webhookEventUpdated);
      expect(mockSendPayment).toHaveBeenCalledTimes(0);
      expect(mockSendDeposit).toHaveBeenCalledTimes(0);
      expect(mockSendDevolution).toHaveBeenCalledTimes(0);
      expect(mockSendDevolutionFailed).toHaveBeenCalledTimes(0);
      expect(mockSendPaymentFailed).toHaveBeenCalledTimes(1);
      expect(mockSendPaymentFailed).toHaveBeenCalledWith(
        targeUrlDecrypted,
        apiKeyDecrypted,
        webhookEvent.data,
      );
    });

    it('TC0008 - Should send devolution failed if webhook event is of type devolution failed', async () => {
      const {
        sut,
        mockGetById,
        mockUpdate,
        mockConfirmedEvent,
        mockDecrypt,
        mockSendDeposit,
        mockSendDevolution,
        mockSendPayment,
        mockSendPaymentFailed,
        mockSendDevolutionFailed,
      } = makeSut();

      const webhookEvent = await WebhookEventFactory.create<WebhookEventEntity>(
        WebhookEventEntity.name,
        {
          state: WebhookEventState.PENDING,
          type: WebhookType.DEVOLUTION_FAILED,
        },
      );

      const httpStatusCodeResponse = '200';

      const webhookEventUpdated = {
        ...webhookEvent,
        state: WebhookEventState.CONFIRMED,
        httpStatusCodeResponse,
      };

      const targeUrlDecrypted = 'target-url-decrypted';
      const apiKeyDecrypted = 'api-key-decrypted';

      mockGetById.mockResolvedValue(webhookEvent);

      mockDecrypt.mockReturnValueOnce(targeUrlDecrypted);
      mockDecrypt.mockReturnValueOnce(apiKeyDecrypted);

      mockSendDevolutionFailed.mockResolvedValue({ httpStatusCodeResponse });

      mockUpdate.mockResolvedValue(webhookEventUpdated);

      const result = await sut.execute(webhookEvent);

      expect(result).toBeDefined();
      expect(mockGetById).toHaveBeenCalledTimes(1);
      expect(mockGetById).toHaveBeenCalledWith(webhookEvent.id);
      expect(mockDecrypt).toHaveBeenCalledTimes(2);
      expect(mockDecrypt).toHaveBeenNthCalledWith(1, webhookEvent.targetUrl);
      expect(mockDecrypt).toHaveBeenNthCalledWith(2, webhookEvent.apiKey);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith(webhookEventUpdated);
      expect(mockConfirmedEvent).toHaveBeenCalledTimes(1);
      expect(mockConfirmedEvent).toHaveBeenCalledWith(webhookEventUpdated);
      expect(mockSendPayment).toHaveBeenCalledTimes(0);
      expect(mockSendDeposit).toHaveBeenCalledTimes(0);
      expect(mockSendDevolution).toHaveBeenCalledTimes(0);
      expect(mockSendPaymentFailed).toHaveBeenCalledTimes(0);
      expect(mockSendDevolutionFailed).toHaveBeenCalledTimes(1);
      expect(mockSendDevolutionFailed).toHaveBeenCalledWith(
        targeUrlDecrypted,
        apiKeyDecrypted,
        webhookEvent.data,
      );
    });
  });
});
