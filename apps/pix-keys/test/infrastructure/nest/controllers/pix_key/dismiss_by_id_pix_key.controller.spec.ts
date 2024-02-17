import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { KeyState, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PixKeyModel,
  DismissByIdPixKeyMicroserviceController as Controller,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  PixKeyInvalidStateException,
  PixKeyNotFoundException,
} from '@zro/pix-keys/application';
import {
  DismissByIdPixKeyRequest,
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import { KafkaContext } from '@nestjs/microservices';

describe('DismissByIdPixKeyMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let pixKeyRepository: PixKeyRepository;

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
  });

  beforeEach(() => jest.resetAllMocks());

  describe('DismissByIdPixKey', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should dismiss pix key successfully', async () => {
        const { userId, id, key, type, createdAt } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
            state: KeyState.OWNERSHIP_READY,
          });

        const message: DismissByIdPixKeyRequest = {
          userId,
          id,
        };

        const result = await controller.execute(
          pixKeyRepository,
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
          state: KeyState.READY,
          createdAt,
        });
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.READY,
        );
      });

      it('TC0002 - Should dismiss pix key successfully', async () => {
        const { userId, id, key, type, createdAt } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
            state: KeyState.PORTABILITY_CANCELED,
          });

        const message: DismissByIdPixKeyRequest = {
          userId,
          id,
        };

        const result = await controller.execute(
          pixKeyRepository,
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
          state: KeyState.CANCELED,
          createdAt,
        });
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.CANCELED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not dismiss a key when id is missing', async () => {
        const { userId } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
        );

        const message: DismissByIdPixKeyRequest = {
          userId,
          id: null,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyEventService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });

      it('TC0004 - Should not dismiss a key when id is not uuid', async () => {
        const { userId } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
        );

        const message: DismissByIdPixKeyRequest = {
          userId,
          id: 'x',
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyEventService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });

      it('TC0005 - Should not dismiss a key when user is not key owner', async () => {
        const { id } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
        );

        const message: DismissByIdPixKeyRequest = {
          userId: uuidV4(),
          id,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyEventService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
      });

      it('TC0006 - Should not dismiss a key when key is not found', async () => {
        const { userId } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
        );

        const message: DismissByIdPixKeyRequest = {
          userId,
          id: uuidV4(),
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyEventService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
      });

      it('TC0007 - Should not dismiss a key in non expected state', async () => {
        const { userId, id } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.PORTABILITY_PENDING },
        );

        const message: DismissByIdPixKeyRequest = {
          userId,
          id,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyEventService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
