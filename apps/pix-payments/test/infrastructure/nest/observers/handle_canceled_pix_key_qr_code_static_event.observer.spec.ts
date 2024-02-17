import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { KeyState } from '@zro/pix-keys/domain';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import {
  CanceledPixKeyQrCodeStaticNestObserver as Observer,
  QrCodeStaticDatabaseRepository,
  QrCodeStaticModel,
} from '@zro/pix-payments/infrastructure';
import {
  HandleCanceledPixKeyQrCodeStaticEventRequest,
  QrCodeStaticEventEmitterControllerInterface,
  QrCodeStaticEventType,
} from '@zro/pix-payments/interface';
import { QrCodeStaticFactory } from '@zro/test/pix-payments/config';

describe('CanceledPixKeyQrCodeStaticNestObserver', () => {
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

  describe('HandleDeletingQrCodeStaticDeadLetterEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle delete QrCodeStatic successfully', async () => {
        const pixKeyId = uuidV4();
        const { userId } = await QrCodeStaticFactory.create<QrCodeStaticModel>(
          QrCodeStaticModel.name,
          { state: QrCodeStaticState.READY, keyId: pixKeyId },
        );

        const message: HandleCanceledPixKeyQrCodeStaticEventRequest = {
          id: pixKeyId,
          userId,
          state: KeyState.CANCELED,
        };

        await controller.execute(
          message,
          qrCodeStaticRepository,
          eventEmitter,
          logger,
        );

        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitQrCodeStaticEvent.mock.calls[0][0]).toBe(
          QrCodeStaticEventType.DELETING,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle delete if incorrect state', async () => {
        const pixKeyId = uuidV4();
        const { userId } = await QrCodeStaticFactory.create<QrCodeStaticModel>(
          QrCodeStaticModel.name,
          { state: QrCodeStaticState.DELETING, keyId: pixKeyId },
        );

        const message: HandleCanceledPixKeyQrCodeStaticEventRequest = {
          id: pixKeyId,
          userId,
          state: KeyState.CANCELED,
        };

        await controller.execute(
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
