import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import {
  ClaimReasonType,
  KeyState,
  PixKeyRepository,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import { PixKeyGateway } from '@zro/pix-keys/application';
import {
  KAFKA_HUB,
  PixKeyModel,
  PixKeyClaimModel,
  PixKeyDatabaseRepository,
  PixKeyClaimDatabaseRepository,
  PortabilityRequestCancelPixKeyNestObserver,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  HandlePortabilityRequestCancelOpenedPixKeyEventRequest,
  HandlePortabilityRequestCancelStartedPixKeyEventRequest,
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';
import { PixKeyFactory, PixKeyClaimFactory } from '@zro/test/pix-keys/config';
import * as mocks from '@zro/test/pix-keys/config/mocks/cancel_portability_claim_pix_key.mock';

describe('PortabilityRequestCancelPixKeyNestObserver', () => {
  let module: TestingModule;
  let controller: PortabilityRequestCancelPixKeyNestObserver;
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
  const mockCancelPortabilityClaimPixKeyPspGateway: jest.Mock = On(
    mockPixKeyGateway,
  ).get(method((mock) => mock.cancelPortabilityClaim));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();

    controller = module.get<PortabilityRequestCancelPixKeyNestObserver>(
      PortabilityRequestCancelPixKeyNestObserver,
    );
    pixKeyRepository = new PixKeyDatabaseRepository();
    pixKeyClaimRepository = new PixKeyClaimDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('handlePortabilityRequestCancelOpenedPixKeyEventViaTopazio', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle portability cancel opened event successfully', async () => {
        mockCancelPortabilityClaimPixKeyPspGateway.mockImplementationOnce(
          mocks.success,
        );

        const reason = ClaimReasonType.USER_REQUESTED;

        const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
          PixKeyClaimModel.name,
        );

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          {
            state: KeyState.PORTABILITY_REQUEST_CANCEL_OPENED,
            claimId: claim.id,
          },
        );

        const message: HandlePortabilityRequestCancelOpenedPixKeyEventRequest =
          {
            id,
            userId,
            state,
            reason,
          };

        await controller.handlePortabilityRequestCancelOpenedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
          pixKeyClaimRepository,
        );

        expect(
          mockCancelPortabilityClaimPixKeyPspGateway,
        ).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.PORTABILITY_REQUEST_CANCEL_STARTED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle portability cancel opened event with incorret state', async () => {
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.READY },
        );

        const reason = ClaimReasonType.USER_REQUESTED;
        const message: HandlePortabilityRequestCancelOpenedPixKeyEventRequest =
          {
            id,
            userId,
            state,
            reason,
          };

        await controller.handlePortabilityRequestCancelOpenedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
          pixKeyClaimRepository,
        );

        expect(
          mockCancelPortabilityClaimPixKeyPspGateway,
        ).toHaveBeenCalledTimes(0);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle portability cancel opened event with psp offline', async () => {
        mockCancelPortabilityClaimPixKeyPspGateway.mockImplementationOnce(
          mocks.offline,
        );

        const reason = ClaimReasonType.USER_REQUESTED;

        const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
          PixKeyClaimModel.name,
        );

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          {
            state: KeyState.PORTABILITY_REQUEST_CANCEL_OPENED,
            claimId: claim.id,
          },
        );

        const message: HandlePortabilityRequestCancelOpenedPixKeyEventRequest =
          {
            id,
            userId,
            state,
            reason,
          };

        await controller.handlePortabilityRequestCancelOpenedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
          pixKeyClaimRepository,
        );

        expect(
          mockCancelPortabilityClaimPixKeyPspGateway,
        ).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService.mock.calls[0][0]).toBe(
          KAFKA_HUB.PORTABILITY_CANCEL_OPENED.DEAD_LETTER,
        );
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('handlePortabilityRequestCancelStartedPixKeyEvent', () => {
    describe('With valid parameters', () => {
      it('TC0004 - Should handle portability cancel started event successfully', async () => {
        const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
          PixKeyClaimModel.name,
        );

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          {
            state: KeyState.PORTABILITY_REQUEST_CANCEL_STARTED,
            claimId: claim.id,
          },
        );

        const message: HandlePortabilityRequestCancelStartedPixKeyEventRequest =
          {
            id,
            userId,
            state,
          };

        await controller.handlePortabilityRequestCancelStartedPixKeyEvent(
          message,
          pixKeyRepository,
          pixKeyEventService,
          logger,
        );

        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.READY,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0005 - Should not handle portability cancel started event with incorret state', async () => {
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.READY },
        );

        const message: HandlePortabilityRequestCancelStartedPixKeyEventRequest =
          {
            id,
            userId,
            state,
          };

        await controller.handlePortabilityRequestCancelStartedPixKeyEvent(
          message,
          pixKeyRepository,
          pixKeyEventService,
          logger,
        );

        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
