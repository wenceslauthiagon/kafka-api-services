import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { EncryptService, defaultLogger as logger } from '@zro/common';
import {
  WebhookEventRepository,
  WebhookEventState,
  WebhookType,
} from '@zro/webhooks/domain';
import { WebhookTargetGateway } from '@zro/webhooks/application';
import { AppModule } from '@zro/webhooks/infrastructure/nest/modules/app.module';
import {
  WebhookEventDatabaseRepository,
  WebhookEventNestObserver as Observer,
  WebhookEventModel,
} from '@zro/webhooks/infrastructure';
import {
  HandleWebhookEventCreatedRequest,
  WebhookEventEmitterControllerInterface,
  WebhookEventType,
} from '@zro/webhooks/interface';
import { WebhookEventFactory } from '@zro/test/webhooks/config';

describe('WebhooksNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let webhookEventRepository: WebhookEventRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  const eventEmitter: WebhookEventEmitterControllerInterface =
    createMock<WebhookEventEmitterControllerInterface>();
  const mockEmitWebhookEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitWebhookEvent),
  );

  const encryptService: EncryptService = createMock<EncryptService>();
  const mockDecrypt: jest.Mock = On(encryptService).get(
    method((mock) => mock.decrypt),
  );

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

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EncryptService)
      .useValue(encryptService)
      .compile();
    controller = module.get<Observer>(Observer);
    webhookEventRepository = new WebhookEventDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('handleCreatedWebhookEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle webhook event created of type payment successfully', async () => {
        const webhookEvent =
          await WebhookEventFactory.create<WebhookEventModel>(
            WebhookEventModel.name,
            {
              state: WebhookEventState.PENDING,
              type: WebhookType.PAYMENT_COMPLETED,
            },
          );

        const { id, state } = webhookEvent;

        const message: HandleWebhookEventCreatedRequest = { id, state };

        const targeUrlDecrypted = 'target-url-decrypted';
        const apiKeyDecrypted = 'api-key-decrypted';

        mockDecrypt.mockReturnValueOnce(targeUrlDecrypted);
        mockDecrypt.mockReturnValueOnce(apiKeyDecrypted);

        mockSendPayment.mockResolvedValue({ httpStatusCodeResponse: '200' });

        await controller.handleCreatedWebhookEvent(
          message,
          webhookEventRepository,
          webhookTargetGateway,
          eventEmitter,
          logger,
          ctx,
        );

        expect(mockSendDeposit).toHaveBeenCalledTimes(0);
        expect(mockSendDevolution).toHaveBeenCalledTimes(0);
        expect(mockSendDevolutionCompleted).toHaveBeenCalledTimes(0);
        expect(mockSendPayment).toHaveBeenCalledTimes(1);
        expect(mockSendPayment).toHaveBeenCalledWith(
          targeUrlDecrypted,
          apiKeyDecrypted,
          webhookEvent.data,
        );
        expect(mockEmitWebhookEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitWebhookEvent.mock.calls[0][0]).toBe(
          WebhookEventType.CONFIRMED,
        );
      });

      it('TC0002 - Should handle webhook event created of type deposit received successfully', async () => {
        const webhookEvent =
          await WebhookEventFactory.create<WebhookEventModel>(
            WebhookEventModel.name,
            {
              state: WebhookEventState.PENDING,
              type: WebhookType.DEPOSIT_RECEIVED,
            },
          );

        const { id, state } = webhookEvent;

        const message: HandleWebhookEventCreatedRequest = { id, state };

        const targeUrlDecrypted = 'target-url-decrypted';
        const apiKeyDecrypted = 'api-key-decrypted';

        mockDecrypt.mockReturnValueOnce(targeUrlDecrypted);
        mockDecrypt.mockReturnValueOnce(apiKeyDecrypted);

        mockSendDeposit.mockResolvedValue({ httpStatusCodeResponse: '200' });

        await controller.handleCreatedWebhookEvent(
          message,
          webhookEventRepository,
          webhookTargetGateway,
          eventEmitter,
          logger,
          ctx,
        );

        expect(mockSendDevolution).toHaveBeenCalledTimes(0);
        expect(mockSendPayment).toHaveBeenCalledTimes(0);
        expect(mockSendDevolutionCompleted).toHaveBeenCalledTimes(0);
        expect(mockSendDeposit).toHaveBeenCalledTimes(1);
        expect(mockSendDeposit).toHaveBeenCalledWith(
          targeUrlDecrypted,
          apiKeyDecrypted,
          webhookEvent.data,
        );
        expect(mockEmitWebhookEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitWebhookEvent.mock.calls[0][0]).toBe(
          WebhookEventType.CONFIRMED,
        );
      });

      it('TC0003 - Should handle webhook event created of type devolution received successfully', async () => {
        const webhookEvent =
          await WebhookEventFactory.create<WebhookEventModel>(
            WebhookEventModel.name,
            {
              state: WebhookEventState.PENDING,
              type: WebhookType.DEVOLUTION_RECEIVED,
            },
          );

        const { id, state } = webhookEvent;

        const message: HandleWebhookEventCreatedRequest = { id, state };

        const targeUrlDecrypted = 'target-url-decrypted';
        const apiKeyDecrypted = 'api-key-decrypted';

        mockDecrypt.mockReturnValueOnce(targeUrlDecrypted);
        mockDecrypt.mockReturnValueOnce(apiKeyDecrypted);

        mockSendDevolution.mockResolvedValue({ httpStatusCodeResponse: '200' });

        await controller.handleCreatedWebhookEvent(
          message,
          webhookEventRepository,
          webhookTargetGateway,
          eventEmitter,
          logger,
          ctx,
        );

        expect(mockSendDeposit).toHaveBeenCalledTimes(0);
        expect(mockSendPayment).toHaveBeenCalledTimes(0);
        expect(mockSendDevolutionCompleted).toHaveBeenCalledTimes(0);
        expect(mockSendDevolution).toHaveBeenCalledTimes(1);
        expect(mockSendDevolution).toHaveBeenCalledWith(
          targeUrlDecrypted,
          apiKeyDecrypted,
          webhookEvent.data,
        );
        expect(mockEmitWebhookEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitWebhookEvent.mock.calls[0][0]).toBe(
          WebhookEventType.CONFIRMED,
        );
      });

      it('TC0004 - Should handle webhook event created of type devolution completed successfully', async () => {
        const webhookEvent =
          await WebhookEventFactory.create<WebhookEventModel>(
            WebhookEventModel.name,
            {
              state: WebhookEventState.PENDING,
              type: WebhookType.DEVOLUTION_COMPLETED,
            },
          );

        const { id, state } = webhookEvent;

        const message: HandleWebhookEventCreatedRequest = { id, state };

        const targeUrlDecrypted = 'target-url-decrypted';
        const apiKeyDecrypted = 'api-key-decrypted';

        mockDecrypt.mockReturnValueOnce(targeUrlDecrypted);
        mockDecrypt.mockReturnValueOnce(apiKeyDecrypted);

        mockSendDevolutionCompleted.mockResolvedValue({
          httpStatusCodeResponse: '200',
        });

        await controller.handleCreatedWebhookEvent(
          message,
          webhookEventRepository,
          webhookTargetGateway,
          eventEmitter,
          logger,
          ctx,
        );

        expect(mockSendDeposit).toHaveBeenCalledTimes(0);
        expect(mockSendPayment).toHaveBeenCalledTimes(0);
        expect(mockSendDevolution).toHaveBeenCalledTimes(0);
        expect(mockSendDevolutionCompleted).toHaveBeenCalledTimes(1);
        expect(mockSendDevolutionCompleted).toHaveBeenCalledWith(
          targeUrlDecrypted,
          apiKeyDecrypted,
          webhookEvent.data,
        );
        expect(mockEmitWebhookEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitWebhookEvent.mock.calls[0][0]).toBe(
          WebhookEventType.CONFIRMED,
        );
      });

      it('TC0005 - Should handle webhook event created of type payment failed successfully', async () => {
        const webhookEvent =
          await WebhookEventFactory.create<WebhookEventModel>(
            WebhookEventModel.name,
            {
              state: WebhookEventState.PENDING,
              type: WebhookType.PAYMENT_FAILED,
            },
          );

        const { id, state } = webhookEvent;

        const message: HandleWebhookEventCreatedRequest = { id, state };

        const targeUrlDecrypted = 'target-url-decrypted';
        const apiKeyDecrypted = 'api-key-decrypted';

        mockDecrypt.mockReturnValueOnce(targeUrlDecrypted);
        mockDecrypt.mockReturnValueOnce(apiKeyDecrypted);

        mockSendPaymentFailed.mockResolvedValue({
          httpStatusCodeResponse: '200',
        });

        await controller.handleCreatedWebhookEvent(
          message,
          webhookEventRepository,
          webhookTargetGateway,
          eventEmitter,
          logger,
          ctx,
        );

        expect(mockSendDeposit).toHaveBeenCalledTimes(0);
        expect(mockSendDevolution).toHaveBeenCalledTimes(0);
        expect(mockSendDevolutionCompleted).toHaveBeenCalledTimes(0);
        expect(mockSendPayment).toHaveBeenCalledTimes(0);
        expect(mockSendPaymentFailed).toHaveBeenCalledTimes(1);
        expect(mockSendPaymentFailed).toHaveBeenCalledWith(
          targeUrlDecrypted,
          apiKeyDecrypted,
          webhookEvent.data,
        );
        expect(mockEmitWebhookEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitWebhookEvent.mock.calls[0][0]).toBe(
          WebhookEventType.CONFIRMED,
        );
      });

      it('TC0006 - Should handle webhook event created of type devolution failed successfully', async () => {
        const webhookEvent =
          await WebhookEventFactory.create<WebhookEventModel>(
            WebhookEventModel.name,
            {
              state: WebhookEventState.PENDING,
              type: WebhookType.DEVOLUTION_FAILED,
            },
          );

        const { id, state } = webhookEvent;

        const message: HandleWebhookEventCreatedRequest = { id, state };

        const targeUrlDecrypted = 'target-url-decrypted';
        const apiKeyDecrypted = 'api-key-decrypted';

        mockDecrypt.mockReturnValueOnce(targeUrlDecrypted);
        mockDecrypt.mockReturnValueOnce(apiKeyDecrypted);

        mockSendDevolutionFailed.mockResolvedValue({
          httpStatusCodeResponse: '200',
        });

        await controller.handleCreatedWebhookEvent(
          message,
          webhookEventRepository,
          webhookTargetGateway,
          eventEmitter,
          logger,
          ctx,
        );

        expect(mockSendDeposit).toHaveBeenCalledTimes(0);
        expect(mockSendDevolution).toHaveBeenCalledTimes(0);
        expect(mockSendDevolutionCompleted).toHaveBeenCalledTimes(0);
        expect(mockSendPayment).toHaveBeenCalledTimes(0);
        expect(mockSendPaymentFailed).toHaveBeenCalledTimes(0);
        expect(mockSendDevolutionFailed).toHaveBeenCalledTimes(1);
        expect(mockSendDevolutionFailed).toHaveBeenCalledWith(
          targeUrlDecrypted,
          apiKeyDecrypted,
          webhookEvent.data,
        );
        expect(mockEmitWebhookEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitWebhookEvent.mock.calls[0][0]).toBe(
          WebhookEventType.CONFIRMED,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
