import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import {
  KeyState,
  PixKeyClaimRepository,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { PixKeyNotFoundException } from '@zro/pix-keys/application';
import {
  PixKeyModel,
  CancelPortabilityClaimProcessMicroserviceController as Controller,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
  PixKeyClaimModel,
  PixKeyClaimDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  CancelPortabilityClaimProcessRequest,
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';
import { PixKeyClaimFactory, PixKeyFactory } from '@zro/test/pix-keys/config';
import { KafkaContext } from '@nestjs/microservices';

describe('CancelPortabilityClaimProcessMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let pixKeyRepository: PixKeyRepository;
  let pixKeyClaimRepository: PixKeyClaimRepository;

  const pixKeyEventService: PixKeyEventEmitterControllerInterface =
    createMock<PixKeyEventEmitterControllerInterface>();
  const mockEmitPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.emitPixKeyEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PixKeyEventKafkaEmitter)
      .useValue(pixKeyEventService)
      .compile();
    controller = module.get<Controller>(Controller);
    pixKeyRepository = new PixKeyDatabaseRepository();
    pixKeyClaimRepository = new PixKeyClaimDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CancelPortabilityClaimProcess', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should cancel process successfully', async () => {
        const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
          PixKeyClaimModel.name,
        );

        const { id, key, type, createdAt } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
            state: KeyState.PORTABILITY_STARTED,
            claim,
          });

        const message: CancelPortabilityClaimProcessRequest = {
          key,
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
          state: KeyState.PORTABILITY_CANCELED,
          createdAt,
        });
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.PORTABILITY_CANCELED,
        );
      });

      it('TC0002 - Should cancel portability process with already portability canceled key successfully', async () => {
        const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
          PixKeyClaimModel.name,
        );

        const { id, key, type, createdAt } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
            state: KeyState.PORTABILITY_CANCELED,
            claim,
          });

        const message: CancelPortabilityClaimProcessRequest = {
          key,
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
          state: KeyState.PORTABILITY_CANCELED,
          createdAt,
        });
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not cancel portability process on a canceled key', async () => {
        const { key } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          {
            state: KeyState.CANCELED,
          },
        );

        const message: CancelPortabilityClaimProcessRequest = {
          key,
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
