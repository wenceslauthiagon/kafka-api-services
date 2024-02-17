import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { KeyState, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  OwnershipOpenedPixKeyNestObserver,
  PixKeyDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  HandleOwnershipOpenedPixKeyEventRequest,
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('OwnershipOpenedPixKeyNestObserver', () => {
  let module: TestingModule;
  let controller: OwnershipOpenedPixKeyNestObserver;
  let pixKeyRepository: PixKeyRepository;

  const pixKeyEventService: PixKeyEventEmitterControllerInterface =
    createMock<PixKeyEventEmitterControllerInterface>();
  const mockEmitPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.emitPixKeyEvent),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<OwnershipOpenedPixKeyNestObserver>(
      OwnershipOpenedPixKeyNestObserver,
    );
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleOwnershipOpenedPixKeyDeadLetterEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle ownership opened failed event successfully', async () => {
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.OWNERSHIP_OPENED },
        );

        const message: HandleOwnershipOpenedPixKeyEventRequest = {
          id,
          userId,
          state,
        };

        await controller.handleOwnershipOpenedPixKeyDeadLetterEvent(
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
      it('TC0002 - Should not handle ownership opened failed event with incorret state', async () => {
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.READY },
        );

        const message: HandleOwnershipOpenedPixKeyEventRequest = {
          id,
          userId,
          state,
        };

        await controller.handleOwnershipOpenedPixKeyDeadLetterEvent(
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
