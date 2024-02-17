import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import {
  ClaimReasonType,
  KeyState,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  ClaimPendingExpiredPixKeyNestObserver,
  PixKeyDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  HandleClaimPendingExpiredPixKeyEventRequest,
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';

describe('ClaimPendingExpiredPixKeyNestObserver', () => {
  let module: TestingModule;
  let controller: ClaimPendingExpiredPixKeyNestObserver;
  let pixKeyRepository: PixKeyRepository;

  const pixKeyEventService: PixKeyEventEmitterControllerInterface =
    createMock<PixKeyEventEmitterControllerInterface>();
  const mockEmitPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.emitPixKeyEvent),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<ClaimPendingExpiredPixKeyNestObserver>(
      ClaimPendingExpiredPixKeyNestObserver,
    );
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleClaimPendingExpiredPixKeyEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should closing key successfully', async () => {
        const reason: ClaimReasonType = ClaimReasonType.DEFAULT_OPERATION;
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CLAIM_PENDING },
        );

        const message: HandleClaimPendingExpiredPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
        };

        await controller.execute(
          message,
          pixKeyRepository,
          pixKeyEventService,
          logger,
        );

        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.CLAIM_CLOSING,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not closing key with READY state', async () => {
        const reason: ClaimReasonType = ClaimReasonType.DEFAULT_OPERATION;
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.READY },
        );

        const message: HandleClaimPendingExpiredPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
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
