import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { KeyState, KeyType, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  ConfirmedPixKeyNestObserver,
  PixKeyDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  HandleConfirmedPixKeyEventRequest,
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('ConfirmedPixKeyNestObserver', () => {
  let module: TestingModule;
  let controller: ConfirmedPixKeyNestObserver;
  let pixKeyRepository: PixKeyRepository;

  const pixKeyEventService: PixKeyEventEmitterControllerInterface =
    createMock<PixKeyEventEmitterControllerInterface>();
  const mockEmitPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.emitPixKeyEvent),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<ConfirmedPixKeyNestObserver>(
      ConfirmedPixKeyNestObserver,
    );
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleAddedFailedPixKeyEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle added failed pix key successfully', async () => {
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CONFIRMED, type: KeyType.CPF },
        );

        const message: HandleConfirmedPixKeyEventRequest = {
          id,
          userId,
          state,
        };

        await controller.handleConfirmedPixKeyDeadLetterEvent(
          message,
          pixKeyRepository,
          pixKeyEventService,
          logger,
        );

        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.ERROR,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle added failed pix key with incorret state', async () => {
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.READY },
        );

        const message: HandleConfirmedPixKeyEventRequest = {
          id,
          userId,
          state,
        };

        await controller.handleConfirmedPixKeyDeadLetterEvent(
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
