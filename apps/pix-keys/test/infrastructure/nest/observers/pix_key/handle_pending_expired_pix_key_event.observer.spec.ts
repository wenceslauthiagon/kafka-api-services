import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import { KeyState, KeyType, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PendingExpiredPixKeyNestObserver,
  PixKeyDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  HandlePendingExpiredPixKeyEventRequest,
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';

describe('PendingExpiredPixKeyNestObserver', () => {
  let module: TestingModule;
  let controller: PendingExpiredPixKeyNestObserver;
  let pixKeyRepository: PixKeyRepository;

  const pixKeyEventService: PixKeyEventEmitterControllerInterface =
    createMock<PixKeyEventEmitterControllerInterface>();
  const mockEmitPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.emitPixKeyEvent),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<PendingExpiredPixKeyNestObserver>(
      PendingExpiredPixKeyNestObserver,
    );
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandlePendingExpiredPixKeyEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should cancel pix key successfully', async () => {
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.PENDING, type: KeyType.EMAIL },
        );

        const message: HandlePendingExpiredPixKeyEventRequest = {
          id,
          userId,
          state,
        };

        await controller.execute(
          message,
          pixKeyRepository,
          pixKeyEventService,
          logger,
        );

        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.CANCELED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not cancel pix key with incorret state', async () => {
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.READY },
        );

        const message: HandlePendingExpiredPixKeyEventRequest = {
          id,
          userId,
          state,
        };

        await controller.execute(
          message,
          pixKeyRepository,
          pixKeyEventService,
          logger,
        );

        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
