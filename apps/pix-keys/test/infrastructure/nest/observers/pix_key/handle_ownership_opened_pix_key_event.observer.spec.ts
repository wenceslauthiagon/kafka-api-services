import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import * as mocks from '@zro/test/pix-keys/config/mocks/create_ownership_claim_pix_key.mock';
import { PixKeyGateway } from '@zro/pix-keys/application';
import { KeyState, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  OwnershipOpenedPixKeyNestObserver,
  PixKeyDatabaseRepository,
  PixKeyModel,
  KAFKA_HUB,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  HandleConfirmedPixKeyEventRequest,
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('OwnershipOpenedPixKeyNestObserver', () => {
  let module: TestingModule;
  let controller: OwnershipOpenedPixKeyNestObserver;
  let pixKeyRepository: PixKeyRepository;

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
  const mockCreateOwnershipClaimPixKeyPspGateway: jest.Mock = On(
    mockPixKeyGateway,
  ).get(method((mock) => mock.createOwnershipClaim));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();

    controller = module.get<OwnershipOpenedPixKeyNestObserver>(
      OwnershipOpenedPixKeyNestObserver,
    );
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleOnwershipOpenedPixKeyEventViaTopazio', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle ownership opened event successfully', async () => {
        mockCreateOwnershipClaimPixKeyPspGateway.mockImplementationOnce(
          mocks.success,
        );

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.OWNERSHIP_OPENED },
        );

        const message: HandleConfirmedPixKeyEventRequest = {
          id,
          userId,
          state,
        };

        await controller.handleOwnershipOpenedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

        expect(mockCreateOwnershipClaimPixKeyPspGateway).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.OWNERSHIP_STARTED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle ownership opened event with incorret state', async () => {
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.READY },
        );

        const message: HandleConfirmedPixKeyEventRequest = {
          id,
          userId,
          state,
        };

        await controller.handleOwnershipOpenedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

        expect(mockCreateOwnershipClaimPixKeyPspGateway).toHaveBeenCalledTimes(
          0,
        );
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle ownership opened event with psp offline', async () => {
        mockCreateOwnershipClaimPixKeyPspGateway.mockImplementationOnce(
          mocks.offline,
        );

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.OWNERSHIP_OPENED },
        );

        const message: HandleConfirmedPixKeyEventRequest = {
          id,
          userId,
          state,
        };

        await controller.handleOwnershipOpenedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

        expect(mockCreateOwnershipClaimPixKeyPspGateway).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService.mock.calls[0][0]).toBe(
          KAFKA_HUB.OWNERSHIP_OPENED.DEAD_LETTER,
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
