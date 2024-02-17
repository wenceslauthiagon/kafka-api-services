import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { KafkaService, defaultLogger as logger } from '@zro/common';
import {
  KeyState,
  PixKeyEntity,
  ClaimStatusType,
  ClaimType,
} from '@zro/pix-keys/domain';
import { NotifyClaimRepository } from '@zro/api-topazio/domain';
import { PixKeyNotFoundException } from '@zro/pix-keys/application';
import { NotifyClaimInvalidFlowException } from '@zro/api-topazio/application';
import { HandleNotifyClaimTopazioEventRequest } from '@zro/api-topazio/interface';
import {
  NotifyClaimTopazioNestObserver,
  KAFKA_HUB,
  PixKeyServiceKafka,
} from '@zro/api-topazio/infrastructure';
import { AppModule } from '@zro/api-topazio/infrastructure/nest/modules/app.module';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('NotifyClaimTopazioNestObserver', () => {
  let module: TestingModule;
  let controller: NotifyClaimTopazioNestObserver;

  const pixKeyService: PixKeyServiceKafka = createMock<PixKeyServiceKafka>();
  const mockGetByPixKeyService: jest.Mock = On(pixKeyService).get(
    method((mock) => mock.getPixKeyByKey),
  );
  const mockCancelPortabilityPixKeyService: jest.Mock = On(pixKeyService).get(
    method((mock) => mock.cancelPortabilityClaim),
  );
  const kafkaService: KafkaService = createMock<KafkaService>();
  const mockEmitkafkaService: jest.Mock = On(kafkaService).get(
    method((mock) => mock.emit),
  );
  const notifyClaimRepository: NotifyClaimRepository =
    createMock<NotifyClaimRepository>();

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();
    controller = module.get<NotifyClaimTopazioNestObserver>(
      NotifyClaimTopazioNestObserver,
    );
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleNotifyClaimTopazioEventViaPixKey', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle notify claim successfully', async () => {
        const pixKey = await PixKeyFactory.create<PixKeyEntity>(
          PixKeyEntity.name,
          { state: KeyState.PORTABILITY_STARTED },
        );
        mockGetByPixKeyService.mockResolvedValue(pixKey);
        mockCancelPortabilityPixKeyService.mockResolvedValue(() =>
          Promise.resolve(),
        );

        const requestId = uuidV4();
        const message: HandleNotifyClaimTopazioEventRequest = {
          id: requestId,
          externalId: requestId,
          key: pixKey.key,
          donation: false,
          status: ClaimStatusType.CANCELLED,
          claimType: ClaimType.PORTABILITY,
        };

        await controller.handleNotifyClaimTopazioEventViaPixKey(
          message,
          logger,
          pixKeyService,
          notifyClaimRepository,
          ctx,
        );

        expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockCancelPortabilityPixKeyService).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle notify claim with invalid pix key', async () => {
        const pixKey = await PixKeyFactory.create<PixKeyEntity>(
          PixKeyEntity.name,
          { state: KeyState.PORTABILITY_STARTED },
        );
        mockGetByPixKeyService.mockResolvedValue(undefined);

        const requestId = uuidV4();
        const message: HandleNotifyClaimTopazioEventRequest = {
          id: requestId,
          externalId: requestId,
          key: pixKey.key,
          donation: false,
          status: ClaimStatusType.CANCELLED,
          claimType: ClaimType.PORTABILITY,
        };

        const testScript = () =>
          controller.handleNotifyClaimTopazioEventViaPixKey(
            message,
            logger,
            pixKeyService,
            notifyClaimRepository,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
        expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService.mock.calls[0][0]).toBe(
          KAFKA_HUB.NOTIFY_CLAIM.DEAD_LETTER,
        );
      });
    });

    it('TC0003 - Should not handle notify claim with invalid flow (status portability started and donation true)', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_STARTED },
      );
      mockGetByPixKeyService.mockResolvedValue(pixKey);
      mockCancelPortabilityPixKeyService.mockResolvedValue(() =>
        Promise.resolve(),
      );

      const requestId = uuidV4();
      const message: HandleNotifyClaimTopazioEventRequest = {
        id: requestId,
        externalId: requestId,
        key: pixKey.key,
        donation: true,
        status: ClaimStatusType.CANCELLED,
        claimType: ClaimType.PORTABILITY,
      };

      const testScript = () =>
        controller.handleNotifyClaimTopazioEventViaPixKey(
          message,
          logger,
          pixKeyService,
          notifyClaimRepository,
          ctx,
        );

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
      expect(mockCancelPortabilityPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockEmitkafkaService.mock.calls[0][0]).toBe(
        KAFKA_HUB.NOTIFY_CLAIM.DEAD_LETTER,
      );
    });

    it('TC0004 - Should not handle notify claim with invalid status (key status is pending)', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PENDING },
      );
      mockGetByPixKeyService.mockResolvedValue(pixKey);
      mockCancelPortabilityPixKeyService.mockResolvedValue(() =>
        Promise.resolve(),
      );

      const requestId = uuidV4();
      const message: HandleNotifyClaimTopazioEventRequest = {
        id: requestId,
        externalId: requestId,
        key: pixKey.key,
        donation: true,
        status: ClaimStatusType.CANCELLED,
        claimType: ClaimType.PORTABILITY,
      };

      await controller.handleNotifyClaimTopazioEventViaPixKey(
        message,
        logger,
        pixKeyService,
        notifyClaimRepository,
        ctx,
      );

      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
      expect(mockCancelPortabilityPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockEmitkafkaService.mock.calls[0]).toBeUndefined();
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
