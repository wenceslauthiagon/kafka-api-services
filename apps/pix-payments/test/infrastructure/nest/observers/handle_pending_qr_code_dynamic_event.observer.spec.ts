import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { KafkaService, defaultLogger as logger } from '@zro/common';
import {
  QrCodeDynamicRepository,
  PixQrCodeDynamicState,
} from '@zro/pix-payments/domain';
import { PixPaymentGateway } from '@zro/pix-payments/application';
import {
  PendingQrCodeDynamicNestObserver as Observer,
  QrCodeDynamicDatabaseRepository,
  QrCodeDynamicModel,
  KAFKA_HUB,
} from '@zro/pix-payments/infrastructure';
import {
  HandlePendingQrCodeDynamicEventRequest,
  QrCodeDynamicEventEmitterControllerInterface,
  QrCodeDynamicEventType,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { QrCodeDynamicFactory } from '@zro/test/pix-payments/config';
import * as createQrCodeDynamicPspGatewayMock from '@zro/test/pix-payments/config/mocks/create_qr_code_dynamic.mock';

describe('PendingQrCodeDynamicNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let qrCodeDynamicRepository: QrCodeDynamicRepository;

  const eventEmitter: QrCodeDynamicEventEmitterControllerInterface =
    createMock<QrCodeDynamicEventEmitterControllerInterface>();
  const mockEmitQrCodeDynamicEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitQrCodeDynamicEvent),
  );

  const kafkaService: KafkaService = createMock<KafkaService>();
  const mockEmitkafkaService: jest.Mock = On(kafkaService).get(
    method((mock) => mock.emit),
  );

  const pspGateway: PixPaymentGateway = createMock<PixPaymentGateway>();
  const mockCreateGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.createQrCodeDynamicDueDate),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();

    controller = module.get<Observer>(Observer);
    qrCodeDynamicRepository = new QrCodeDynamicDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandlePendingQrCodeDynamicEventViaTopazio', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle created QrCodeDynamic successfully', async () => {
        const { id, userId, state, txId } =
          await QrCodeDynamicFactory.create<QrCodeDynamicModel>(
            QrCodeDynamicModel.name,
            { state: PixQrCodeDynamicState.PENDING },
          );

        mockCreateGateway.mockImplementationOnce(
          createQrCodeDynamicPspGatewayMock.success,
        );

        const message: HandlePendingQrCodeDynamicEventRequest = {
          id,
          userId,
          state,
          txId,
        };

        await controller.handlePendingQrCodeDynamicEventViaTopazio(
          message,
          qrCodeDynamicRepository,
          eventEmitter,
          pspGateway,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitQrCodeDynamicEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitQrCodeDynamicEvent.mock.calls[0][0]).toBe(
          QrCodeDynamicEventType.READY,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle created if incorrect state', async () => {
        const { id, userId, state, txId } =
          await QrCodeDynamicFactory.create<QrCodeDynamicModel>(
            QrCodeDynamicModel.name,
            { state: PixQrCodeDynamicState.READY },
          );

        const message: HandlePendingQrCodeDynamicEventRequest = {
          id,
          userId,
          state,
          txId,
        };

        await controller.handlePendingQrCodeDynamicEventViaTopazio(
          message,
          qrCodeDynamicRepository,
          eventEmitter,
          pspGateway,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitQrCodeDynamicEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle created with psp offline', async () => {
        const { id, userId, state, txId } =
          await QrCodeDynamicFactory.create<QrCodeDynamicModel>(
            QrCodeDynamicModel.name,
            { state: PixQrCodeDynamicState.PENDING },
          );

        mockCreateGateway.mockImplementationOnce(
          createQrCodeDynamicPspGatewayMock.offline,
        );

        const message: HandlePendingQrCodeDynamicEventRequest = {
          id,
          userId,
          state,
          txId,
        };

        await controller.handlePendingQrCodeDynamicEventViaTopazio(
          message,
          qrCodeDynamicRepository,
          eventEmitter,
          pspGateway,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService.mock.calls[0][0]).toBe(
          KAFKA_HUB.QR_CODE_DYNAMIC.PENDING.DEAD_LETTER,
        );
        expect(mockEmitQrCodeDynamicEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
