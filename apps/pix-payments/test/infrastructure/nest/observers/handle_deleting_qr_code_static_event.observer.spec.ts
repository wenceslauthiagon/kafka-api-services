import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import {
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import { PixPaymentGateway } from '@zro/pix-payments/application';
import {
  DeletingQrCodeStaticNestObserver as Observer,
  QrCodeStaticDatabaseRepository,
  QrCodeStaticModel,
  KAFKA_HUB,
} from '@zro/pix-payments/infrastructure';
import {
  HandleDeletingQrCodeStaticEventRequest,
  QrCodeStaticEventEmitterControllerInterface,
  QrCodeStaticEventType,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import * as deleteQrCodeStaticPspGatewayMock from '@zro/test/pix-payments/config/mocks/delete_qr_code_static.mock';
import { QrCodeStaticFactory } from '@zro/test/pix-payments/config';

describe('DeletingQrCodeStaticNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let qrCodeStaticRepository: QrCodeStaticRepository;

  const eventEmitter: QrCodeStaticEventEmitterControllerInterface =
    createMock<QrCodeStaticEventEmitterControllerInterface>();
  const mockEmitQrCodeStaticEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitQrCodeStaticEvent),
  );

  const kafkaService: KafkaService = createMock<KafkaService>();
  const mockEmitkafkaService: jest.Mock = On(kafkaService).get(
    method((mock) => mock.emit),
  );

  const pspGateway: PixPaymentGateway = createMock<PixPaymentGateway>();
  const mockDeleteGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.deleteQrCodeStatic),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();
    controller = module.get<Observer>(Observer);
    qrCodeStaticRepository = new QrCodeStaticDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleDeletingQrCodeStaticEventViaTopazio', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle delete QrCodeStatic successfully', async () => {
        const { id, userId, state, txId, payableManyTimes } =
          await QrCodeStaticFactory.create<QrCodeStaticModel>(
            QrCodeStaticModel.name,
            { state: QrCodeStaticState.DELETING },
          );
        mockDeleteGateway.mockImplementationOnce(
          deleteQrCodeStaticPspGatewayMock.success,
        );

        const message: HandleDeletingQrCodeStaticEventRequest = {
          id,
          userId,
          state,
          txId,
          payableManyTimes,
        };

        await controller.handleDeletingQrCodeStaticEventViaTopazio(
          message,
          qrCodeStaticRepository,
          eventEmitter,
          pspGateway,
          logger,
          ctx,
        );

        expect(mockDeleteGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitQrCodeStaticEvent.mock.calls[0][0]).toBe(
          QrCodeStaticEventType.DELETED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle delete if incorrect state', async () => {
        const { id, userId, state, txId, payableManyTimes } =
          await QrCodeStaticFactory.create<QrCodeStaticModel>(
            QrCodeStaticModel.name,
            { state: QrCodeStaticState.READY },
          );

        const message: HandleDeletingQrCodeStaticEventRequest = {
          id,
          userId,
          state,
          txId,
          payableManyTimes,
        };

        await controller.handleDeletingQrCodeStaticEventViaTopazio(
          message,
          qrCodeStaticRepository,
          eventEmitter,
          pspGateway,
          logger,
          ctx,
        );

        expect(mockDeleteGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle delete with psp offline', async () => {
        const { id, userId, state, txId, payableManyTimes } =
          await QrCodeStaticFactory.create<QrCodeStaticModel>(
            QrCodeStaticModel.name,
            { state: QrCodeStaticState.DELETING },
          );
        mockDeleteGateway.mockImplementationOnce(
          deleteQrCodeStaticPspGatewayMock.offline,
        );

        const message: HandleDeletingQrCodeStaticEventRequest = {
          id,
          userId,
          state,
          txId,
          payableManyTimes,
        };

        await controller.handleDeletingQrCodeStaticEventViaTopazio(
          message,
          qrCodeStaticRepository,
          eventEmitter,
          pspGateway,
          logger,
          ctx,
        );

        expect(mockDeleteGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService.mock.calls[0][0]).toBe(
          KAFKA_HUB.QR_CODE_STATIC.DELETING.DEAD_LETTER,
        );
        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
