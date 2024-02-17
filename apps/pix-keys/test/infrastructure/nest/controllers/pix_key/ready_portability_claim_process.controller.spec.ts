import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { getMoment, defaultLogger as logger } from '@zro/common';
import {
  KeyState,
  PixKeyClaimRepository,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { PixKeyNotFoundException } from '@zro/pix-keys/application';
import {
  PixKeyModel,
  ReadyPortabilityClaimProcessMicroserviceController as Controller,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
  PixKeyClaimDatabaseRepository,
  PixKeyClaimModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
  ReadyPortabilityClaimProcessRequest,
} from '@zro/pix-keys/interface';
import { PixKeyClaimFactory, PixKeyFactory } from '@zro/test/pix-keys/config';
import { KafkaContext } from '@nestjs/microservices';

const DAY_IN_SECONDS = 24 * 60 * 60;
const TIMESTAMP = 7 * DAY_IN_SECONDS; // 7 days in seconds.

describe('ReadyPortabilityClaimProcessMicroserviceController', () => {
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

  describe('ReadyPortabilityClaimProcess', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should ready process successfully', async () => {
        const notExpiredDate = getMoment()
          .subtract(TIMESTAMP, 'seconds')
          .add(DAY_IN_SECONDS, 'seconds')
          .toDate();

        const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
          PixKeyClaimModel.name,
          { claimOpeningDate: notExpiredDate },
        );

        const { id, key, type, createdAt } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
            state: KeyState.READY,
            claim: pixKeyClaim,
          });

        const message: ReadyPortabilityClaimProcessRequest = {
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
          state: KeyState.PORTABILITY_REQUEST_AUTO_CONFIRMED,
          createdAt,
        });
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.PORTABILITY_REQUEST_AUTO_CONFIRMED,
        );
      });

      it('TC0002 - Should ready portability process with already portability request pending key successfully', async () => {
        const { id, key, type, createdAt } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
            state: KeyState.PORTABILITY_REQUEST_PENDING,
          });

        const message: ReadyPortabilityClaimProcessRequest = {
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
          state: KeyState.PORTABILITY_REQUEST_PENDING,
          createdAt,
        });
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not ready portability process on a canceled key', async () => {
        const { key } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          {
            state: KeyState.CANCELED,
          },
        );

        const message: ReadyPortabilityClaimProcessRequest = {
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
