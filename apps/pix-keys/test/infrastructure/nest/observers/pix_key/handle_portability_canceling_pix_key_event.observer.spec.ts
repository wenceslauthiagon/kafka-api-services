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
  PortabilityCancelingPixKeyNestObserver,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  HandlePortabilityCancelingPixKeyEventRequest,
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import * as mocks from '@zro/test/pix-keys/config/mocks/cancel_portability_claim_pix_key.mock';

describe('PortabilityCancelingPixKeyNestObserver', () => {
  let module: TestingModule;
  let controller: PortabilityCancelingPixKeyNestObserver;
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
  const mockCancelPortabilityClaimPixKeyPspGateway: jest.Mock = On(
    mockPixKeyGateway,
  ).get(method((mock) => mock.cancelPortabilityClaim));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();

    controller = module.get<PortabilityCancelingPixKeyNestObserver>(
      PortabilityCancelingPixKeyNestObserver,
    );
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('handlePortabilityCancelingPixKeyEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle portability canceling event successfully', async () => {
        mockCancelPortabilityClaimPixKeyPspGateway.mockImplementationOnce(
          mocks.success,
        );

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.PORTABILITY_CANCELING, claimId: uuidV4() },
        );

        const message: HandlePortabilityCancelingPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
        };

        await controller.handlePortabilityCancelingPixKeyEventViaGateway(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

        expect(
          mockCancelPortabilityClaimPixKeyPspGateway,
        ).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.PORTABILITY_CANCELED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle portability canceling event with incorret state', async () => {
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.READY },
        );

        const message: HandlePortabilityCancelingPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
        };

        await controller.handlePortabilityCancelingPixKeyEventViaGateway(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

        expect(
          mockCancelPortabilityClaimPixKeyPspGateway,
        ).toHaveBeenCalledTimes(0);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle portability canceling event with psp offline', async () => {
        mockCancelPortabilityClaimPixKeyPspGateway.mockImplementationOnce(
          mocks.offline,
        );

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.PORTABILITY_CANCELING, claimId: uuidV4() },
        );

        const message: HandlePortabilityCancelingPixKeyEventRequest = {
          id,
          userId,
          state,
          reason,
        };

        await controller.handlePortabilityCancelingPixKeyEventViaGateway(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

        expect(
          mockCancelPortabilityClaimPixKeyPspGateway,
        ).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService.mock.calls[0][0]).toBe(
          KAFKA_HUB.PORTABILITY_CANCELING.DEAD_LETTER,
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
