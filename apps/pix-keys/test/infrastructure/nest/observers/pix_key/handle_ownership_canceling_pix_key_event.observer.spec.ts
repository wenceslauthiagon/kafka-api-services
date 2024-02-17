import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import {
  ClaimReasonType,
  KeyState,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { PixKeyGateway } from '@zro/pix-keys/application';
import {
  KAFKA_HUB,
  PixKeyModel,
  PixKeyDatabaseRepository,
  OwnershipCancelingPixKeyNestObserver,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  HandleOwnershipCancelingPixKeyEventRequest,
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import * as mocks from '@zro/test/pix-keys/config/mocks/denied_claim_pix_key.mock';

describe('OwnershipCancelingPixKeyNestObserver', () => {
  let module: TestingModule;
  let controller: OwnershipCancelingPixKeyNestObserver;
  let pixKeyRepository: PixKeyRepository;
  const reason = ClaimReasonType.USER_REQUESTED;

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

    controller = module.get<OwnershipCancelingPixKeyNestObserver>(
      OwnershipCancelingPixKeyNestObserver,
    );
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('handleOwnershipCancelingPixKeyEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle ownership canceling event successfully', async () => {
        mockDeniedClaimPixKeyPspGateway.mockImplementationOnce(mocks.success);

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.OWNERSHIP_CANCELING, claimId: uuidV4() },
        );

        const message: HandleOwnershipCancelingPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
        };

        await controller.handleOwnershipCancelingPixKeyEventViaGateway(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

        expect(mockDeniedClaimPixKeyPspGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.OWNERSHIP_CANCELED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle ownership canceling event with incorret state', async () => {
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.READY },
        );

        const message: HandleOwnershipCancelingPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
        };

        await controller.handleOwnershipCancelingPixKeyEventViaGateway(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

        expect(mockDeniedClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle ownership canceling event with psp offline', async () => {
        mockDeniedClaimPixKeyPspGateway.mockImplementationOnce(mocks.offline);

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.OWNERSHIP_CANCELING, claimId: uuidV4() },
        );

        const message: HandleOwnershipCancelingPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
        };

        await controller.handleOwnershipCancelingPixKeyEventViaGateway(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

        expect(mockDeniedClaimPixKeyPspGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService.mock.calls[0][0]).toBe(
          KAFKA_HUB.OWNERSHIP_CANCELING.DEAD_LETTER,
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
