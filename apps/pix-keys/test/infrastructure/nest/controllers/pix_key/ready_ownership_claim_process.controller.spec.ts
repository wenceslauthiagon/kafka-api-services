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
  ReadyOwnershipClaimProcessMicroserviceController as Controller,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
  PixKeyClaimModel,
  PixKeyClaimDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
  ReadyOwnershipClaimProcessRequest,
} from '@zro/pix-keys/interface';
import { PixKeyClaimFactory, PixKeyFactory } from '@zro/test/pix-keys/config';
import { KafkaContext } from '@nestjs/microservices';

describe('ReadyOwnershipClaimProcessMicroserviceController', () => {
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

  describe('ReadyOwnershipClaimProcess', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should ready process successfully', async () => {
        const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
          PixKeyClaimModel.name,
        );

        const { id, key, type, createdAt } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
            state: KeyState.READY,
            claim,
          });

        const message: ReadyOwnershipClaimProcessRequest = {
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
          state: KeyState.CLAIM_PENDING,
          createdAt,
        });
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.CLAIM_PENDING,
        );
      });

      it('TC0002 - Should ready ownership process with already ownership claim pending key successfully', async () => {
        const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
          PixKeyClaimModel.name,
        );

        const { id, key, type, createdAt } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
            state: KeyState.CLAIM_PENDING,
            claim,
          });

        const message: ReadyOwnershipClaimProcessRequest = {
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
          state: KeyState.CLAIM_PENDING,
          createdAt,
        });
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not ready ownership process on a canceled key', async () => {
        const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
          PixKeyClaimModel.name,
        );

        const { key } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          {
            state: KeyState.CANCELED,
            claim,
          },
        );

        const message: ReadyOwnershipClaimProcessRequest = {
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
