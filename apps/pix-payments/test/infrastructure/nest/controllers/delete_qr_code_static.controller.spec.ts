import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
  ForbiddenException,
} from '@zro/common';
import {
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import { QrCodeStaticNotFoundException } from '@zro/pix-payments/application';
import {
  DeleteByQrCodeStaticIdMicroserviceController as Controller,
  QrCodeStaticDatabaseRepository,
  QrCodeStaticModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  DeleteByQrCodeStaticIdRequest,
  QrCodeStaticEventEmitterControllerInterface,
  QrCodeStaticEventType,
} from '@zro/pix-payments/interface';
import { QrCodeStaticFactory } from '@zro/test/pix-payments/config';

describe('DeleteByQrCodeStaticIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let qrCodeStaticRepository: QrCodeStaticRepository;

  const eventEmitter: QrCodeStaticEventEmitterControllerInterface =
    createMock<QrCodeStaticEventEmitterControllerInterface>();
  const mockEmitQrCodeStaticEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitQrCodeStaticEvent),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    qrCodeStaticRepository = new QrCodeStaticDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('DeleteByIdQrCodeStatic', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should delete qrCodeStatic successfully', async () => {
        const qrCodeStatic =
          await QrCodeStaticFactory.create<QrCodeStaticModel>(
            QrCodeStaticModel.name,
            { state: QrCodeStaticState.READY },
          );

        const message: DeleteByQrCodeStaticIdRequest = {
          id: qrCodeStatic.id,
          userId: qrCodeStatic.userId,
        };

        await controller.execute(
          qrCodeStaticRepository,
          eventEmitter,
          logger,
          message,
        );

        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitQrCodeStaticEvent.mock.calls[0][0]).toBe(
          QrCodeStaticEventType.DELETING,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - should not delete with state deleting', async () => {
        const qrCodeStatic =
          await QrCodeStaticFactory.create<QrCodeStaticModel>(
            QrCodeStaticModel.name,
            { state: QrCodeStaticState.DELETING },
          );

        const message: DeleteByQrCodeStaticIdRequest = {
          id: qrCodeStatic.id,
          userId: qrCodeStatic.userId,
        };

        await controller.execute(
          qrCodeStaticRepository,
          eventEmitter,
          logger,
          message,
        );

        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not delete the qrCodeStatic if another user has this qrCodeStatic id', async () => {
        const qrCodeStatic =
          await QrCodeStaticFactory.create<QrCodeStaticModel>(
            QrCodeStaticModel.name,
          );
        const userId = faker.datatype.uuid();

        const message: DeleteByQrCodeStaticIdRequest = {
          id: qrCodeStatic.id,
          userId,
        };

        const testScript = () =>
          controller.execute(
            qrCodeStaticRepository,
            eventEmitter,
            logger,
            message,
          );

        await expect(testScript).rejects.toThrow(ForbiddenException);
        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0004 - Should not delete if qrCodeStatic is not found', async () => {
        const userId = faker.datatype.uuid();

        const message: DeleteByQrCodeStaticIdRequest = {
          id: faker.datatype.uuid(),
          userId,
        };

        const testScript = () =>
          controller.execute(
            qrCodeStaticRepository,
            eventEmitter,
            logger,
            message,
          );

        await expect(testScript).rejects.toThrow(QrCodeStaticNotFoundException);
        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0005 - Should not delete if id is null', async () => {
        const userId = faker.datatype.uuid();

        const message: DeleteByQrCodeStaticIdRequest = {
          id: null,
          userId,
        };

        const testScript = () =>
          controller.execute(
            qrCodeStaticRepository,
            eventEmitter,
            logger,
            message,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
