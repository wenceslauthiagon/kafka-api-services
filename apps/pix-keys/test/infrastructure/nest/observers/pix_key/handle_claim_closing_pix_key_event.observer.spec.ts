import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import { PixKeyGateway } from '@zro/pix-keys/application';
import {
  ClaimReasonType,
  KeyState,
  PixKeyRepository,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import {
  ClaimClosingPixKeyNestObserver,
  PixKeyDatabaseRepository,
  PixKeyClaimDatabaseRepository,
  PixKeyModel,
  PixKeyClaimModel,
  KAFKA_HUB,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  HandleClaimClosingPixKeyEventRequest,
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';
import { PixKeyFactory, PixKeyClaimFactory } from '@zro/test/pix-keys/config';
import * as mocks from '@zro/test/pix-keys/config/mocks/create_portability_claim_pix_key.mock';

describe('ClaimClosingPixKeyNestObserver', () => {
  let module: TestingModule;
  let controller: ClaimClosingPixKeyNestObserver;
  let pixKeyRepository: PixKeyRepository;
  let pixKeyClaimRepository: PixKeyClaimRepository;

  const pixKeyEventService: PixKeyEventEmitterControllerInterface =
    createMock<PixKeyEventEmitterControllerInterface>();
  const mockEmitPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.emitPixKeyEvent),
  );

  const kafkaService: KafkaService = createMock<KafkaService>();
  const mockEmitkafkaService: jest.Mock = On(kafkaService).get(
    method((mock) => mock.emit),
  );

  const mockPixKeyGateway: PixKeyGateway = createMock<PixKeyGateway>();
  const mockClosingClaimPixKeyPspGateway: jest.Mock = On(mockPixKeyGateway).get(
    method((mock) => mock.closingClaim),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();
    controller = module.get<ClaimClosingPixKeyNestObserver>(
      ClaimClosingPixKeyNestObserver,
    );
    pixKeyRepository = new PixKeyDatabaseRepository();
    pixKeyClaimRepository = new PixKeyClaimDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleClaimClosingPixKeyEventViaTopazio', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle claim closing event successfully', async () => {
        mockClosingClaimPixKeyPspGateway.mockImplementationOnce(mocks.success);
        const reason = ClaimReasonType.USER_REQUESTED;

        const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
          PixKeyClaimModel.name,
        );

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CLAIM_CLOSING, claimId: claim.id },
        );

        const message: HandleClaimClosingPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
        };

        await controller.handleClaimClosingPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
          pixKeyClaimRepository,
        );

        expect(mockClosingClaimPixKeyPspGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.CLAIM_CLOSED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle claim closing event with idempotency', async () => {
        const reason = ClaimReasonType.USER_REQUESTED;
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CLAIM_CLOSED },
        );

        const message: HandleClaimClosingPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
        };

        await controller.handleClaimClosingPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
          pixKeyClaimRepository,
        );

        expect(mockClosingClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle claim closing event with incorret state', async () => {
        const reason = ClaimReasonType.USER_REQUESTED;
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

        await controller.handleClaimClosingPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
          pixKeyClaimRepository,
        );

        expect(mockClosingClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0004 - Should not handle claim closing event with psp offline', async () => {
        mockClosingClaimPixKeyPspGateway.mockImplementationOnce(mocks.offline);
        const reason = ClaimReasonType.USER_REQUESTED;

        const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
          PixKeyClaimModel.name,
        );

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CLAIM_CLOSING, claimId: claim.id },
        );

        const message: HandleClaimClosingPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
        };

        await controller.handleClaimClosingPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
          pixKeyClaimRepository,
        );

        expect(mockClosingClaimPixKeyPspGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService.mock.calls[0][0]).toBe(
          KAFKA_HUB.CLAIM_CLOSING.DEAD_LETTER,
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
