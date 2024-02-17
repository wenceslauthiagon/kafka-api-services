import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import * as deletePixKeyPspGatewayMock from '@zro/test/pix-keys/config/mocks/delete_pix_key.mock';
import { PixKeyGateway } from '@zro/pix-keys/application';
import { KeyState, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  DeletingPixKeyNestObserver,
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

describe('DeletingPixKeyNestObserver', () => {
  let module: TestingModule;
  let controller: DeletingPixKeyNestObserver;
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
  const mockDeletePixKeyPspGateway: jest.Mock = On(mockPixKeyGateway).get(
    method((mock) => mock.deletePixKey),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();

    controller = module.get<DeletingPixKeyNestObserver>(
      DeletingPixKeyNestObserver,
    );
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleDeletedPixKeyEventViaTopazio', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle deleted pix key successfully', async () => {
        mockDeletePixKeyPspGateway.mockImplementationOnce(
          deletePixKeyPspGatewayMock.success,
        );

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.DELETING },
        );

        const message: HandleConfirmedPixKeyEventRequest = {
          id,
          userId,
          state,
        };

        await controller.handleDeletedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

        expect(mockDeletePixKeyPspGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.DELETED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle deleted pix key with incorret state', async () => {
        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.READY },
        );

        const message: HandleConfirmedPixKeyEventRequest = {
          id,
          userId,
          state,
        };

        await controller.handleDeletedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

        expect(mockDeletePixKeyPspGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle deleted pix key with psp offline', async () => {
        mockDeletePixKeyPspGateway.mockImplementationOnce(
          deletePixKeyPspGatewayMock.offline,
        );

        const { id, userId, state } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.DELETING },
        );

        const message: HandleConfirmedPixKeyEventRequest = {
          id,
          userId,
          state,
        };

        await controller.handleDeletedPixKeyEventViaTopazio(
          message,
          pixKeyRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

        expect(mockDeletePixKeyPspGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService.mock.calls[0][0]).toBe(
          KAFKA_HUB.DELETING.DEAD_LETTER,
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
