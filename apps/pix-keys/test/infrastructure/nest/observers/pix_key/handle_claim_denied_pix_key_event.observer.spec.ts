import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import { PixKeyFactory, PixKeyClaimFactory } from '@zro/test/pix-keys/config';
import * as mocks from '@zro/test/pix-keys/config/mocks/create_portability_claim_pix_key.mock';
import { PixKeyGateway } from '@zro/pix-keys/application';
import {
  ClaimReasonType,
  KeyState,
  PixKeyRepository,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import {
  ClaimDeniedPixKeyNestObserver,
  PixKeyDatabaseRepository,
  PixKeyClaimDatabaseRepository,
  PixKeyModel,
  PixKeyClaimModel,
  KAFKA_HUB,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  HandleClaimDeniedPixKeyEventRequest,
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('ClaimDeniedPixKeyNestObserver', () => {
  let module: TestingModule;
  let controller: ClaimDeniedPixKeyNestObserver;
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
  const mockDeniedClaimPixKeyPspGateway: jest.Mock = On(mockPixKeyGateway).get(
    method((mock) => mock.deniedClaim),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();

    controller = module.get<ClaimDeniedPixKeyNestObserver>(
      ClaimDeniedPixKeyNestObserver,
    );
    pixKeyRepository = new PixKeyDatabaseRepository();
    pixKeyClaimRepository = new PixKeyClaimDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleClaimDeniedPixKeyEventViaTopazio', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle claim denied event successfully', async () => {
        mockDeniedClaimPixKeyPspGateway.mockImplementationOnce(mocks.success);
        const reason = ClaimReasonType.USER_REQUESTED;

        const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
          PixKeyClaimModel.name,
        );

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CLAIM_DENIED, claimId: claim.id },
        );

        const message: HandleClaimDeniedPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
        };

        await controller.handleClaimDeniedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
          pixKeyClaimRepository,
        );

        expect(mockDeniedClaimPixKeyPspGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.READY,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle claim denied event with idempotency', async () => {
        const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.READY },
        );

        const message: HandleClaimDeniedPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
        };

        await controller.handleClaimDeniedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
          pixKeyClaimRepository,
        );

        expect(mockDeniedClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle claim denied event with incorret state', async () => {
        const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.READY },
        );

        const message: HandleClaimDeniedPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
        };

        await controller.handleClaimDeniedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
          pixKeyClaimRepository,
        );

        expect(mockDeniedClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0004 - Should not handle claim denied event with psp offline', async () => {
        const reason = ClaimReasonType.USER_REQUESTED;
        mockDeniedClaimPixKeyPspGateway.mockImplementationOnce(mocks.offline);

        const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
          PixKeyClaimModel.name,
        );

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CLAIM_DENIED, claimId: claim.id },
        );

        const message: HandleClaimDeniedPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
        };

        await controller.handleClaimDeniedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
          pixKeyClaimRepository,
        );

        expect(mockDeniedClaimPixKeyPspGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService.mock.calls[0][0]).toBe(
          KAFKA_HUB.CLAIM_DENIED.DEAD_LETTER,
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
