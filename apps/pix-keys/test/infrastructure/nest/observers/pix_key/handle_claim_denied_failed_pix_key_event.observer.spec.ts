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
  ClaimDeniedPixKeyNestObserver,
  PixKeyDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  HandleClaimDeniedPixKeyEventRequest,
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('DeniedClaimPixKeyNestObserver', () => {
  let module: TestingModule;
  let controller: ClaimDeniedPixKeyNestObserver;
  let pixKeyRepository: PixKeyRepository;

  const pixKeyEventService: PixKeyEventEmitterControllerInterface =
    createMock<PixKeyEventEmitterControllerInterface>();
  const mockEmitPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.emitPixKeyEvent),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<ClaimDeniedPixKeyNestObserver>(
      ClaimDeniedPixKeyNestObserver,
    );
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleClaimDeniedPixKeyDeadLetterEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle claim denied failed event successfully', async () => {
        const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CLAIM_DENIED },
        );

        const message: HandleClaimDeniedPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
        };

        await controller.handleClaimDeniedPixKeyDeadLetterEvent(
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
      it('TC0002 - Should not handle claim denied failed event with incorret state', async () => {
        const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CLAIM_PENDING },
        );

        const message: HandleClaimDeniedPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
        };

        await controller.handleClaimDeniedPixKeyDeadLetterEvent(
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
