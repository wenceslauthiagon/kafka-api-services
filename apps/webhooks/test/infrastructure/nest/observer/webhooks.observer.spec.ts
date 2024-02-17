import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import {
  PaymentState,
  PixDepositState,
  PixDevolutionState,
  PixDevolutionReceivedState,
  PaymentEntity,
  PixDepositEntity,
  PixDevolutionEntity,
  PixDevolutionReceivedEntity,
} from '@zro/pix-payments/domain';
import {
  WebhookEventRepository,
  WebhookRepository,
  WebhookType,
} from '@zro/webhooks/domain';
import { PixPaymentService } from '@zro/webhooks/application';
import {
  WebhookEventEmitterControllerInterface,
  WebhookEventType,
} from '@zro/webhooks/interface';
import {
  ReceivePixDevolutionStateChangeNotificationRequest,
  SendPaymentStateChangeNotificationRequest,
  SendPixDepositStateChangeNotificationRequest,
  SendPixDevolutionStateChangeNotificationRequest,
} from '@zro/notifications/interface';
import {
  WebhookDatabaseRepository,
  WebhookEventDatabaseRepository,
  WebhookModel,
  WebhooksNestObserver as Observer,
} from '@zro/webhooks/infrastructure';
import { AppModule } from '@zro/webhooks/infrastructure/nest/modules/app.module';
import {
  PaymentFactory,
  PixDepositFactory,
  PixDevolutionFactory,
  PixDevolutionReceivedFactory,
} from '@zro/test/pix-payments/config';
import { WebhookFactory } from '@zro/test/webhooks/config';

describe('WebhooksNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let webhookRepository: WebhookRepository;
  let webhookEventRepository: WebhookEventRepository;

  const eventEmitter: WebhookEventEmitterControllerInterface =
    createMock<WebhookEventEmitterControllerInterface>();
  const mockEmitWebhookEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitWebhookEvent),
  );

  const service: PixPaymentService = createMock<PixPaymentService>();
  const mockGetPaymentById: jest.Mock = On(service).get(
    method((mock) => mock.getById),
  );
  const mockGetPixDepositById: jest.Mock = On(service).get(
    method((mock) => mock.getPixDepositById),
  );
  const mockGetPixDevolutionById: jest.Mock = On(service).get(
    method((mock) => mock.getDevolutionById),
  );
  const mockGetPixDevolutionReceivedById: jest.Mock = On(service).get(
    method((mock) => mock.getDevolutionReceivedById),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Observer>(Observer);
    webhookRepository = new WebhookDatabaseRepository();
    webhookEventRepository = new WebhookEventDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('handleConfirmedPaymentEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle complete Payment successfully', async () => {
        const payment = await PaymentFactory.create<PaymentEntity>(
          PaymentEntity.name,
          { state: PaymentState.CONFIRMED },
        );

        await WebhookFactory.create<WebhookModel>(WebhookModel.name, {
          accountNumber: payment.ownerAccountNumber,
          agencyNumber: payment.ownerBranch,
          type: WebhookType.PAYMENT_COMPLETED,
        });

        const { id, state, user, beneficiaryName, value } = payment;

        const message: SendPaymentStateChangeNotificationRequest = {
          id,
          state,
          userId: user.uuid,
          notificationId: '',
          beneficiaryName,
          value,
        };

        mockGetPaymentById.mockResolvedValue(payment);

        await controller.handleConfirmedPaymentEvent(
          message,
          webhookRepository,
          webhookEventRepository,
          service,
          eventEmitter,
          logger,
        );

        expect(mockGetPaymentById).toHaveBeenCalledTimes(1);
        expect(mockEmitWebhookEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitWebhookEvent.mock.calls[0][0]).toBe(
          WebhookEventType.CREATED,
        );
      });
    });
  });

  describe('handleDepositReceivedEvent', () => {
    describe('With valid parameters', () => {
      it('TC0002 - Should handle deposit received successfully', async () => {
        const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
          { state: PixDepositState.RECEIVED },
        );

        await WebhookFactory.create<WebhookModel>(WebhookModel.name, {
          accountNumber: pixDeposit.clientAccountNumber,
          agencyNumber: pixDeposit.clientBranch,
          type: WebhookType.DEPOSIT_RECEIVED,
        });

        const { id, state, user, amount, thirdPartName } = pixDeposit;

        const message: SendPixDepositStateChangeNotificationRequest = {
          id,
          state,
          userId: user.uuid,
          notificationId: '',
          amount,
          thirdPartName,
        };

        mockGetPixDepositById.mockResolvedValue(pixDeposit);

        await controller.handleDepositReceivedEvent(
          message,
          webhookRepository,
          webhookEventRepository,
          service,
          eventEmitter,
          logger,
        );

        expect(mockGetPixDepositById).toHaveBeenCalledTimes(1);
        expect(mockEmitWebhookEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitWebhookEvent.mock.calls[0][0]).toBe(
          WebhookEventType.CREATED,
        );
      });
    });
  });

  describe('handleConfirmedDevolutionEvent', () => {
    describe('With valid parameters', () => {
      it('TC0003 - Should handle complete devolution successfully', async () => {
        const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
          { state: PixDepositState.RECEIVED },
        );

        const pixDevolution =
          await PixDevolutionFactory.create<PixDevolutionEntity>(
            PixDevolutionEntity.name,
            { state: PixDevolutionState.CONFIRMED },
          );

        await WebhookFactory.create<WebhookModel>(WebhookModel.name, {
          accountNumber: pixDeposit.clientAccountNumber,
          agencyNumber: pixDeposit.clientBranch,
          type: WebhookType.DEVOLUTION_COMPLETED,
        });

        const { id, state, user, amount } = pixDevolution;

        const message: SendPixDevolutionStateChangeNotificationRequest = {
          id,
          state,
          userId: user.uuid,
          notificationId: '',
          amount,
        };

        mockGetPixDevolutionById.mockResolvedValue(pixDevolution);

        mockGetPixDepositById.mockResolvedValue(pixDeposit);

        await controller.handleConfirmedDevolutionEvent(
          message,
          webhookRepository,
          webhookEventRepository,
          service,
          eventEmitter,
          logger,
        );

        expect(mockGetPixDevolutionById).toHaveBeenCalledTimes(1);
        expect(mockEmitWebhookEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitWebhookEvent.mock.calls[0][0]).toBe(
          WebhookEventType.CREATED,
        );
      });
    });
  });

  describe('handleDevolutionReceivedEvent', () => {
    describe('With valid parameters', () => {
      it('TC0004 - Should handle complete devolution successfully', async () => {
        const pixDevolutionReceived =
          await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
            PixDevolutionReceivedEntity.name,
            { state: PixDevolutionReceivedState.READY },
          );

        await WebhookFactory.create<WebhookModel>(WebhookModel.name, {
          accountNumber: pixDevolutionReceived.clientAccountNumber,
          agencyNumber: pixDevolutionReceived.clientBranch,
          type: WebhookType.DEVOLUTION_RECEIVED,
        });

        const { id, state, user, amount } = pixDevolutionReceived;

        const message: ReceivePixDevolutionStateChangeNotificationRequest = {
          id,
          state,
          userId: user.uuid,
          notificationId: '',
          amount,
        };

        mockGetPixDevolutionReceivedById.mockResolvedValue(
          pixDevolutionReceived,
        );

        await controller.handleDevolutionReceivedEvent(
          message,
          webhookRepository,
          webhookEventRepository,
          service,
          eventEmitter,
          logger,
        );

        expect(mockGetPixDevolutionReceivedById).toHaveBeenCalledTimes(1);
        expect(mockEmitWebhookEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitWebhookEvent.mock.calls[0][0]).toBe(
          WebhookEventType.CREATED,
        );
      });
    });
  });

  describe('handleFailedPaymentEvent', () => {
    describe('With valid parameters', () => {
      it('TC0005 - Should handle failed payment successfully', async () => {
        const pixPaymentFailed = await PaymentFactory.create<PaymentEntity>(
          PaymentEntity.name,
          {
            state: PaymentState.FAILED,
          },
        );

        await WebhookFactory.create<WebhookModel>(WebhookModel.name, {
          accountNumber: pixPaymentFailed.ownerAccountNumber,
          agencyNumber: pixPaymentFailed.ownerBranch,
          type: WebhookType.PAYMENT_FAILED,
        });

        const { id, state, user, beneficiaryName, value } = pixPaymentFailed;

        const message: SendPaymentStateChangeNotificationRequest = {
          id,
          state,
          userId: user.uuid,
          notificationId: '',
          beneficiaryName,
          value,
        };

        mockGetPaymentById.mockResolvedValue(pixPaymentFailed);

        await controller.handleFailedPaymentEvent(
          message,
          webhookRepository,
          webhookEventRepository,
          service,
          eventEmitter,
          logger,
        );

        expect(mockGetPaymentById).toHaveBeenCalledTimes(1);
        expect(mockEmitWebhookEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitWebhookEvent.mock.calls[0][0]).toBe(
          WebhookEventType.CREATED,
        );
      });
    });
  });

  describe('handleFailedPixDevolution', () => {
    describe('With valid parameters', () => {
      it('TC0006 - Should handle failed pix devolution successfully', async () => {
        const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
          { state: PixDepositState.RECEIVED },
        );

        const pixDevolution =
          await PixDevolutionFactory.create<PixDevolutionEntity>(
            PixDevolutionEntity.name,
            { state: PixDevolutionState.FAILED },
          );

        await WebhookFactory.create<WebhookModel>(WebhookModel.name, {
          accountNumber: pixDeposit.clientAccountNumber,
          agencyNumber: pixDeposit.clientBranch,
          type: WebhookType.DEVOLUTION_FAILED,
        });

        const { id, state, user, amount } = pixDevolution;

        const message: SendPixDevolutionStateChangeNotificationRequest = {
          id,
          state,
          userId: user.uuid,
          notificationId: '',
          amount,
        };

        mockGetPixDevolutionById.mockResolvedValue(pixDevolution);

        mockGetPixDepositById.mockResolvedValue(pixDeposit);

        await controller.handleFailedPixDevolution(
          message,
          webhookRepository,
          webhookEventRepository,
          service,
          eventEmitter,
          logger,
        );

        expect(mockGetPixDevolutionById).toHaveBeenCalledTimes(1);
        expect(mockEmitWebhookEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitWebhookEvent.mock.calls[0][0]).toBe(
          WebhookEventType.CREATED,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
