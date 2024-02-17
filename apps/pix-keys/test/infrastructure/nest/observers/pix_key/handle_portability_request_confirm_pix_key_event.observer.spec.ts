import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import { PixKeyFactory, PixKeyClaimFactory } from '@zro/test/pix-keys/config';
import * as mocks from '@zro/test/pix-keys/config/mocks/confirm_portability_claim_pix_key.mock';
import { PixKeyGateway } from '@zro/pix-keys/application';
import {
  ClaimReasonType,
  KeyState,
  PixKeyRepository,
  PixKeyClaimRepository,
  PixKeyClaimEntity,
} from '@zro/pix-keys/domain';
import {
  KAFKA_HUB,
  PixKeyModel,
  PixKeyClaimModel,
  PixKeyDatabaseRepository,
  PixKeyClaimDatabaseRepository,
  PortabilityRequestConfirmPixKeyNestObserver,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  HandlePortabilityRequestConfirmOpenedPixKeyEventRequest,
  HandlePortabilityRequestConfirmStartedPixKeyEventRequest,
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('PortabilityRequestConfirmPixKeyNestObserver', () => {
  let module: TestingModule;
  let controller: PortabilityRequestConfirmPixKeyNestObserver;
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
  const mockConfirmPortabilityClaimPixKeyPspGateway: jest.Mock = On(
    mockPixKeyGateway,
  ).get(method((mock) => mock.confirmPortabilityClaim));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();

    controller = module.get<PortabilityRequestConfirmPixKeyNestObserver>(
      PortabilityRequestConfirmPixKeyNestObserver,
    );
    pixKeyRepository = new PixKeyDatabaseRepository();
    pixKeyClaimRepository = new PixKeyClaimDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('handlePortabilityRequestConfirmOpenedPixKeyEventViaTopazio', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle portability confirm opened event successfully', async () => {
        mockConfirmPortabilityClaimPixKeyPspGateway.mockImplementationOnce(
          mocks.success,
        );

        const reason = ClaimReasonType.USER_REQUESTED;

        const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
          PixKeyClaimModel.name,
        );

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          {
            state: KeyState.PORTABILITY_REQUEST_CONFIRM_OPENED,
            claimId: claim.id,
          },
        );

        const message: HandlePortabilityRequestConfirmOpenedPixKeyEventRequest =
          {
            id,
            userId,
            state,
            reason,
          };

        await controller.handlePortabilityRequestConfirmOpenedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
          pixKeyClaimRepository,
        );

        expect(
          mockConfirmPortabilityClaimPixKeyPspGateway,
        ).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.PORTABILITY_REQUEST_CONFIRM_STARTED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle portability confirm opened event with incorret state', async () => {
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.READY },
        );

        const reason = ClaimReasonType.USER_REQUESTED;
        const message: HandlePortabilityRequestConfirmOpenedPixKeyEventRequest =
          {
            id,
            userId,
            state,
            reason,
          };

        await controller.handlePortabilityRequestConfirmOpenedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
          pixKeyClaimRepository,
        );

        expect(
          mockConfirmPortabilityClaimPixKeyPspGateway,
        ).toHaveBeenCalledTimes(0);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle portability confirm opened event with psp offline', async () => {
        mockConfirmPortabilityClaimPixKeyPspGateway.mockImplementationOnce(
          mocks.offline,
        );

        const reason = ClaimReasonType.USER_REQUESTED;
        const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
          PixKeyClaimModel.name,
        );

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          {
            state: KeyState.PORTABILITY_REQUEST_CONFIRM_OPENED,
            claimId: claim.id,
          },
        );

        const message: HandlePortabilityRequestConfirmOpenedPixKeyEventRequest =
          {
            id,
            userId,
            state,
            reason,
          };

        await controller.handlePortabilityRequestConfirmOpenedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
          pixKeyClaimRepository,
        );

        expect(
          mockConfirmPortabilityClaimPixKeyPspGateway,
        ).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService.mock.calls[0][0]).toBe(
          KAFKA_HUB.PORTABILITY_CONFIRM_OPENED.DEAD_LETTER,
        );
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('handlePortabilityRequestConfirmStartedPixKeyEvent', () => {
      describe('With valid parameters', () => {
        it('TC0004 - Should handle portability confirm started event successfully', async () => {
          const claim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
            PixKeyClaimEntity.name,
          );

          const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
            PixKeyModel.name,
            { state: KeyState.PORTABILITY_REQUEST_CONFIRM_STARTED, claim },
          );

          const message: HandlePortabilityRequestConfirmStartedPixKeyEventRequest =
            {
              id,
              userId,
              state,
            };

          await controller.handlePortabilityRequestConfirmStartedPixKeyEvent(
            message,
            pixKeyRepository,
            pixKeyClaimRepository,
            pixKeyEventService,
            logger,
          );

          expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
          expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
          expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
            PixKeyEventType.CANCELED,
          );
        });
      });

      describe('With invalid parameters', () => {
        it('TC0005 - Should not handle portability confirm started event with incorret state', async () => {
          const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
            PixKeyClaimModel.name,
          );

          const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
            PixKeyModel.name,
            { state: KeyState.READY, claimId: claim.id },
          );

          const message: HandlePortabilityRequestConfirmStartedPixKeyEventRequest =
            {
              id,
              userId,
              state,
            };

          await controller.handlePortabilityRequestConfirmStartedPixKeyEvent(
            message,
            pixKeyRepository,
            pixKeyClaimRepository,
            pixKeyEventService,
            logger,
          );

          expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
          expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
