import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import {
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import {
  PendingQrCodeStaticNestObserver as Observer,
  QrCodeStaticDatabaseRepository,
  QrCodeStaticModel,
} from '@zro/pix-payments/infrastructure';
import {
  HandlePendingQrCodeStaticEventRequest,
  QrCodeStaticEventEmitterControllerInterface,
  QrCodeStaticEventType,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { QrCodeStaticFactory } from '@zro/test/pix-payments/config';

describe('PendingQrCodeStaticNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let qrCodeStaticRepository: QrCodeStaticRepository;

  const eventEmitter: QrCodeStaticEventEmitterControllerInterface =
    createMock<QrCodeStaticEventEmitterControllerInterface>();
  const mockEmitQrCodeStaticEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitQrCodeStaticEvent),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<Observer>(Observer);
    qrCodeStaticRepository = new QrCodeStaticDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandlePendingQrCodeStaticDeadLetterEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle failed QrCodeStatic successfully', async () => {
        const { id, userId, state, txId, payableManyTimes } =
          await QrCodeStaticFactory.create<QrCodeStaticModel>(
            QrCodeStaticModel.name,
            { state: QrCodeStaticState.PENDING },
          );

        const message: HandlePendingQrCodeStaticEventRequest = {
          id,
          userId,
          state,
          txId,
          payableManyTimes,
        };

        await controller.handlePendingQrCodeStaticDeadLetterEvent(
          message,
          qrCodeStaticRepository,
          eventEmitter,
          logger,
        );

        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitQrCodeStaticEvent.mock.calls[0][0]).toBe(
          QrCodeStaticEventType.ERROR,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle failed if incorrect state', async () => {
        const { id, userId, state, txId, payableManyTimes } =
          await QrCodeStaticFactory.create<QrCodeStaticModel>(
            QrCodeStaticModel.name,
            { state: QrCodeStaticState.ERROR },
          );

        const message: HandlePendingQrCodeStaticEventRequest = {
          id,
          userId,
          state,
          txId,
          payableManyTimes,
        };

        await controller.handlePendingQrCodeStaticDeadLetterEvent(
          message,
          qrCodeStaticRepository,
          eventEmitter,
          logger,
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
