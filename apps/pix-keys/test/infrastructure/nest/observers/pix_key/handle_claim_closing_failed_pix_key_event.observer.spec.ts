import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import {
  ClaimReasonType,
  KeyState,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  ClaimClosingPixKeyNestObserver,
  PixKeyDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  HandleClaimClosingPixKeyEventRequest,
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('ClaimClosingPixKeyNestObserver', () => {
  let module: TestingModule;
  let controller: ClaimClosingPixKeyNestObserver;
  let pixKeyRepository: PixKeyRepository;

  const pixKeyEventService: PixKeyEventEmitterControllerInterface =
    createMock<PixKeyEventEmitterControllerInterface>();
  const mockEmitPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.emitPixKeyEvent),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<ClaimClosingPixKeyNestObserver>(
      ClaimClosingPixKeyNestObserver,
    );
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleClaimClosingPixKeyDeadLetterEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle claim closing failed event successfully', async () => {
        const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CLAIM_CLOSING },
        );

        const message: HandleClaimClosingPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
        };

        await controller.handleClaimClosingPixKeyDeadLetterEvent(
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
      it('TC0002 - Should not handle claim closing failed event with incorret state', async () => {
        const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.READY },
        );

        const message: HandleClaimClosingPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
        };

        await controller.handleClaimClosingPixKeyDeadLetterEvent(
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
