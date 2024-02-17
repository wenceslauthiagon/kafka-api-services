import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import {
  QrCodeDynamicRepository,
  PixQrCodeDynamicState,
} from '@zro/pix-payments/domain';
import {
  PendingQrCodeDynamicNestObserver as Observer,
  QrCodeDynamicDatabaseRepository,
  QrCodeDynamicModel,
} from '@zro/pix-payments/infrastructure';
import {
  HandlePendingQrCodeDynamicEventRequest,
  QrCodeDynamicEventEmitterControllerInterface,
  QrCodeDynamicEventType,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { QrCodeDynamicFactory } from '@zro/test/pix-payments/config';

describe('PendingQrCodeDynamicNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let qrCodeDynamicRepository: QrCodeDynamicRepository;

  const eventEmitter: QrCodeDynamicEventEmitterControllerInterface =
    createMock<QrCodeDynamicEventEmitterControllerInterface>();
  const mockEmitQrCodeDynamicEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitQrCodeDynamicEvent),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<Observer>(Observer);
    qrCodeDynamicRepository = new QrCodeDynamicDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandlePendingQrCodeDynamicDeadLetterEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle failed QrCodeDynamic successfully', async () => {
        const { id, userId, state, txId } =
          await QrCodeDynamicFactory.create<QrCodeDynamicModel>(
            QrCodeDynamicModel.name,
            { state: PixQrCodeDynamicState.PENDING },
          );

        const message: HandlePendingQrCodeDynamicEventRequest = {
          id,
          userId,
          state,
          txId,
        };

        await controller.handlePendingQrCodeDynamicDeadLetterEvent(
          message,
          qrCodeDynamicRepository,
          eventEmitter,
          logger,
        );

        expect(mockEmitQrCodeDynamicEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitQrCodeDynamicEvent.mock.calls[0][0]).toBe(
          QrCodeDynamicEventType.ERROR,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle failed if incorrect state', async () => {
        const { id, userId, state, txId } =
          await QrCodeDynamicFactory.create<QrCodeDynamicModel>(
            QrCodeDynamicModel.name,
            { state: PixQrCodeDynamicState.ERROR },
          );

        const message: HandlePendingQrCodeDynamicEventRequest = {
          id,
          userId,
          state,
          txId,
        };

        await controller.handlePendingQrCodeDynamicDeadLetterEvent(
          message,
          qrCodeDynamicRepository,
          eventEmitter,
          logger,
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
