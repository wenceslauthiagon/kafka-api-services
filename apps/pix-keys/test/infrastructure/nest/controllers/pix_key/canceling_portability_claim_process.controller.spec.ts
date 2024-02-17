import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger } from '@zro/common';
import {
  ClaimReasonType,
  ClaimStatusType,
  KeyState,
} from '@zro/pix-keys/domain';
import { PixKeyNotFoundException } from '@zro/pix-keys/application';
import {
  PixKeyModel,
  CancelingPortabilityClaimProcessMicroserviceController as Controller,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
  PixKeyClaimDatabaseRepository,
  PixKeyClaimModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  CancelingPortabilityClaimProcessRequest,
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';
import { PixKeyClaimFactory, PixKeyFactory } from '@zro/test/pix-keys/config';

describe('CancelingPortabilityClaimProcessMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  const pixKeyRepository = new PixKeyDatabaseRepository();
  const pixKeyClaimRepository = new PixKeyClaimDatabaseRepository();

  const pixKeyEventService: PixKeyEventEmitterControllerInterface =
    createMock<PixKeyEventEmitterControllerInterface>();
  const mockEmitPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.emitPixKeyEvent),
  );

  const reason = ClaimReasonType.USER_REQUESTED;
  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PixKeyEventKafkaEmitter)
      .useValue(pixKeyEventService)
      .compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CancelingPortabilityClaimProcess', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should canceling process successfully', async () => {
        const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
          PixKeyClaimModel.name,
          { status: ClaimStatusType.WAITING_RESOLUTION },
        );
        const { userId, id, key, type, createdAt } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
            state: KeyState.PORTABILITY_STARTED,
            claimId: pixKeyClaim.id,
          });

        const message: CancelingPortabilityClaimProcessRequest = {
          userId,
          id,
          reason,
        };

        const result = await controller.execute(
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toMatchObject({
          id,
          key,
          type,
          state: KeyState.PORTABILITY_CANCELING,
          createdAt,
        });
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.PORTABILITY_CANCELING,
        );
      });

      it('TC0002 - Should canceling portability process with already canceled', async () => {
        const { userId, id, key, type, createdAt } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
            state: KeyState.PORTABILITY_CANCELING,
          });

        const message: CancelingPortabilityClaimProcessRequest = {
          userId,
          id,
          reason,
        };

        const result = await controller.execute(
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toMatchObject({
          id,
          key,
          type,
          state: KeyState.PORTABILITY_CANCELING,
          createdAt,
        });
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not canceling portability process on a canceled key', async () => {
        const { userId, id } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CANCELED },
        );

        const message: CancelingPortabilityClaimProcessRequest = {
          userId,
          id,
          reason,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyClaimRepository,
            pixKeyEventService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
