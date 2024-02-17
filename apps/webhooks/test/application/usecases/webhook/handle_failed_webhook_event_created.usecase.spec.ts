import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  getMoment,
  defaultLogger as logger,
} from '@zro/common';
import { RetryEntity } from '@zro/utils/domain';
import {
  WebhookEntity,
  WebhookEventEntity,
  WebhookEventRepository,
  WebhookEventState,
  WebhookRepository,
} from '@zro/webhooks/domain';
import {
  HandleFailedWebhookEventCreatedUseCase as UseCase,
  RetryService,
  WebhookEventInvalidStateException,
  WebhookEventNotFoundException,
} from '@zro/webhooks/application';
import { WebhookEventFactory, WebhookFactory } from '@zro/test/webhooks/config';

describe('HandleFailedWebhookEventCreatedUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const webhookEventRepository: WebhookEventRepository =
      createMock<WebhookEventRepository>();
    const mockGetById: jest.Mock = On(webhookEventRepository).get(
      method((mock) => mock.getById),
    );
    const mockUpdate: jest.Mock = On(webhookEventRepository).get(
      method((mock) => mock.update),
    );
    const mockCreate: jest.Mock = On(webhookEventRepository).get(
      method((mock) => mock.create),
    );

    const webhookRepository: WebhookRepository =
      createMock<WebhookRepository>();
    const mockGetWebhookById: jest.Mock = On(webhookRepository).get(
      method((mock) => mock.getById),
    );

    return {
      webhookEventRepository,
      webhookRepository,
      mockGetById,
      mockUpdate,
      mockCreate,
      mockGetWebhookById,
    };
  };

  const mockService = () => {
    const retryService: RetryService = createMock<RetryService>();

    const mockPushRetry: jest.Mock = On(retryService).get(
      method((mock) => mock.push),
    );

    return {
      retryService,
      mockPushRetry,
    };
  };

  const makeSut = () => {
    const {
      webhookEventRepository,
      mockGetById,
      mockUpdate,
      mockCreate,
      webhookRepository,
      mockGetWebhookById,
    } = mockRepository();

    const { retryService, mockPushRetry } = mockService();

    const retryQueue = 'FAKE.RETRY.QUEUE';
    const abortQueue = 'FAKE.ABORT.QUEUE';
    const minSeconds = 10;
    const maxSecons = 3600;

    const sut = new UseCase(
      logger,
      webhookEventRepository,
      webhookRepository,
      retryService,
      retryQueue,
      abortQueue,
      minSeconds,
      maxSecons,
    );

    return {
      sut,
      mockGetById,
      mockUpdate,
      mockPushRetry,
      mockCreate,
      mockGetWebhookById,
      retryQueue,
      abortQueue,
      minSeconds,
      maxSecons,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw if missing webhook event', async () => {
      const {
        sut,
        mockGetById,
        mockUpdate,
        mockPushRetry,
        mockCreate,
        mockGetWebhookById,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetById).toHaveBeenCalledTimes(0);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockPushRetry).toHaveBeenCalledTimes(0);
      expect(mockCreate).toHaveBeenCalledTimes(0);
      expect(mockGetWebhookById).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw if webhook event not has id', async () => {
      const {
        sut,
        mockGetById,
        mockUpdate,
        mockPushRetry,
        mockCreate,
        mockGetWebhookById,
      } = makeSut();

      const testScript = () => sut.execute(new WebhookEventEntity({}));

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetById).toHaveBeenCalledTimes(0);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockPushRetry).toHaveBeenCalledTimes(0);
      expect(mockCreate).toHaveBeenCalledTimes(0);
      expect(mockGetWebhookById).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw if webhook event not has httpStatusCodeResponse', async () => {
      const {
        sut,
        mockGetById,
        mockUpdate,
        mockPushRetry,
        mockCreate,
        mockGetWebhookById,
      } = makeSut();

      const testScript = () =>
        sut.execute(new WebhookEventEntity({ id: 'any-id' }));

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetById).toHaveBeenCalledTimes(0);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockPushRetry).toHaveBeenCalledTimes(0);
      expect(mockCreate).toHaveBeenCalledTimes(0);
      expect(mockGetWebhookById).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC004 - Should not handle failed webhook event if webhook event not is found', async () => {
      const {
        sut,
        mockGetById,
        mockUpdate,
        mockPushRetry,
        mockCreate,
        mockGetWebhookById,
      } = makeSut();

      const webhookEvent = new WebhookEventEntity({
        id: 'any-id',
        httpStatusCodeResponse: '200',
      });

      mockGetById.mockResolvedValue(null);

      const testScript = () => sut.execute(webhookEvent);

      await expect(testScript).rejects.toThrow(WebhookEventNotFoundException);
      expect(mockGetById).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockPushRetry).toHaveBeenCalledTimes(0);
      expect(mockCreate).toHaveBeenCalledTimes(0);
      expect(mockGetWebhookById).toHaveBeenCalledTimes(0);
    });

    it('TC005 - Should return webhook event found if him state if failed', async () => {
      const {
        sut,
        mockGetById,
        mockUpdate,
        mockPushRetry,
        mockCreate,
        mockGetWebhookById,
      } = makeSut();

      const webhookEvent = new WebhookEventEntity({
        id: 'any-id',
        httpStatusCodeResponse: '200',
        state: WebhookEventState.FAILED,
      });

      mockGetById.mockResolvedValue(webhookEvent);

      const result = await sut.execute(webhookEvent);

      expect(result).toBeDefined();
      expect(result).toBe(webhookEvent);
      expect(mockGetById).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockPushRetry).toHaveBeenCalledTimes(0);
      expect(mockCreate).toHaveBeenCalledTimes(0);
      expect(mockGetWebhookById).toHaveBeenCalledTimes(0);
    });

    it('TC006 - Should not handle failed webhook event if webhook event found state is confirmed', async () => {
      const {
        sut,
        mockGetById,
        mockUpdate,
        mockPushRetry,
        mockCreate,
        mockGetWebhookById,
      } = makeSut();

      const webhookEvent = new WebhookEventEntity({
        id: 'any-id',
        httpStatusCodeResponse: '200',
        state: WebhookEventState.CONFIRMED,
      });

      mockGetById.mockResolvedValue(webhookEvent);

      const testScript = () => sut.execute(webhookEvent);

      await expect(testScript).rejects.toThrow(
        WebhookEventInvalidStateException,
      );
      expect(mockGetById).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockPushRetry).toHaveBeenCalledTimes(0);
      expect(mockCreate).toHaveBeenCalledTimes(0);
      expect(mockGetWebhookById).toHaveBeenCalledTimes(0);
    });

    it('TC007 - Should return webhook event found updated if him not is in retry limit', async () => {
      const {
        sut,
        mockGetById,
        mockUpdate,
        mockPushRetry,
        mockCreate,
        mockGetWebhookById,
      } = makeSut();

      const webhookEvent = new WebhookEventEntity({
        id: 'any-id',
        httpStatusCodeResponse: '200',
        state: WebhookEventState.PENDING,
        retryLimit: new Date(),
      });

      const webhookEventUpdated = new WebhookEventEntity({
        ...webhookEvent,
        state: WebhookEventState.FAILED,
        httpStatusCodeResponse: '200',
      });

      mockGetById.mockResolvedValue(webhookEvent);

      const result = await sut.execute(webhookEvent);

      expect(result).toBeDefined();
      expect(result).toStrictEqual(webhookEventUpdated);
      expect(mockGetById).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith({ ...webhookEventUpdated });
      expect(mockPushRetry).toHaveBeenCalledTimes(0);
      expect(mockCreate).toHaveBeenCalledTimes(0);
      expect(mockGetWebhookById).toHaveBeenCalledTimes(0);
    });

    it('TC008 - Should call retry push service to retry webhook event', async () => {
      const {
        sut,
        mockGetById,
        mockUpdate,
        mockPushRetry,
        mockCreate,
        mockGetWebhookById,
        retryQueue,
        abortQueue,
      } = makeSut();

      const webhookEvent = await WebhookEventFactory.create<WebhookEventEntity>(
        WebhookEventEntity.name,
        {
          state: WebhookEventState.PENDING,
          httpStatusCodeResponse: '500',
          retryLimit: new Date('2060'),
        },
      );

      const webhookEventUpdated = new WebhookEventEntity({
        ...webhookEvent,
        state: WebhookEventState.FAILED,
      });

      const date = new Date();

      Date.now = jest.fn().mockReturnValue(date);

      const lastRetry = getMoment(date).add(10, 'seconds').toDate();

      const webhookEventToCreate = new WebhookEventEntity({
        state: WebhookEventState.PENDING,
        targetUrl: webhookEventUpdated.targetUrl,
        apiKey: webhookEventUpdated.apiKey,
        webhook: webhookEventUpdated.webhook,
        type: webhookEventUpdated.type,
        accountNumber: webhookEventUpdated.accountNumber,
        agencyNumber: webhookEventUpdated.agencyNumber,
        data: webhookEventUpdated.data,
        retryLimit: webhookEventUpdated.retryLimit,
        lastRetry,
      });

      const webhookEventCreated =
        await WebhookEventFactory.create<WebhookEventEntity>(
          WebhookEventEntity.name,
          { ...webhookEventToCreate },
        );

      const webhook = await WebhookFactory.create<WebhookEntity>(
        WebhookEntity.name,
      );

      const data = {
        key: `${webhookEventCreated.id}`,
        headers: { requestId: webhookEventCreated.id },
        value: {
          id: webhookEventCreated.id,
          state: webhookEventCreated.state,
        },
      };

      const retry = new RetryEntity({
        id: webhookEventCreated.id,
        counter: 1,
        retryQueue: retryQueue,
        failQueue: abortQueue,
        retryAt: lastRetry,
        abortAt: webhookEvent.retryLimit,
        data,
      });

      mockGetById.mockResolvedValue(webhookEvent);
      mockCreate.mockResolvedValue(webhookEventCreated);
      mockGetWebhookById.mockResolvedValue(webhook);

      const result = await sut.execute(webhookEvent);

      expect(result).toBeDefined();
      expect(result).toStrictEqual(webhookEventCreated);
      expect(mockGetById).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith(webhookEventUpdated);
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith(webhookEventToCreate);
      expect(mockPushRetry).toHaveBeenCalledTimes(1);
      expect(mockPushRetry).toHaveBeenCalledWith(retry);
      expect(mockGetWebhookById).toHaveBeenCalledTimes(1);
      expect(mockGetWebhookById).toHaveBeenCalledWith(webhookEvent.webhook?.id);
    });
  });
});
