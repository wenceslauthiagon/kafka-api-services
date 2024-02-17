import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import * as createPixKeyPspGatewayMock from '@zro/test/pix-keys/config/mocks/delete_pix_key.mock';
import { PixKeyGateway } from '@zro/pix-keys/application';
import { KeyState, KeyType, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  ConfirmedPixKeyNestObserver,
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

describe('ConfirmedPixKeyNestObserver', () => {
  let module: TestingModule;
  let controller: ConfirmedPixKeyNestObserver;
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
  const mockCreatePixKeyPspGateway: jest.Mock = On(mockPixKeyGateway).get(
    method((mock) => mock.createPixKey),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();
    controller = module.get<ConfirmedPixKeyNestObserver>(
      ConfirmedPixKeyNestObserver,
    );
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleAddedPixKeyEventViaTopazio', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle added pix key successfully', async () => {
        mockCreatePixKeyPspGateway.mockImplementationOnce(
          createPixKeyPspGatewayMock.success,
        );

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CONFIRMED, type: KeyType.CPF },
        );

        const message: HandleConfirmedPixKeyEventRequest = {
          id,
          userId,
          state,
        };

        await controller.handleConfirmedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

        expect(mockCreatePixKeyPspGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.ADD_READY,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle added pix key with incorret state', async () => {
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.READY },
        );

        const message: HandleConfirmedPixKeyEventRequest = {
          id,
          userId,
          state,
        };

        await controller.handleConfirmedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

        expect(mockCreatePixKeyPspGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle added pix key with psp offline', async () => {
        mockCreatePixKeyPspGateway.mockImplementationOnce(
          createPixKeyPspGatewayMock.offline,
        );

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CONFIRMED },
        );

        const message: HandleConfirmedPixKeyEventRequest = {
          id,
          userId,
          state,
        };

        await controller.handleConfirmedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

        expect(mockCreatePixKeyPspGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService.mock.calls[0][0]).toBe(
          KAFKA_HUB.CONFIRMED.DEAD_LETTER,
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
