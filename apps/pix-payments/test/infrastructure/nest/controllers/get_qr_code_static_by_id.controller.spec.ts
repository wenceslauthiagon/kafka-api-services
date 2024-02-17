import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
  ForbiddenException,
} from '@zro/common';
import { QrCodeStaticNotFoundException } from '@zro/pix-payments/application';
import { QrCodeStaticRepository } from '@zro/pix-payments/domain';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  GetByQrCodeStaticIdMicroserviceController as Controller,
  QrCodeStaticDatabaseRepository,
  QrCodeStaticModel,
} from '@zro/pix-payments/infrastructure';
import { QrCodeStaticFactory } from '@zro/test/pix-payments/config';
import { GetByQrCodeStaticIdRequest } from '@zro/pix-payments/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('GetByQrCodeStaticIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let qrCodeStaticRepository: QrCodeStaticRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    qrCodeStaticRepository = new QrCodeStaticDatabaseRepository();
  });

  describe('GetByIdQrCodeStatic', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get qrCodeStatic successfully', async () => {
        const qrCodeStatic =
          await QrCodeStaticFactory.create<QrCodeStaticModel>(
            QrCodeStaticModel.name,
          );

        const message: GetByQrCodeStaticIdRequest = {
          id: qrCodeStatic.id,
          userId: qrCodeStatic.userId,
        };

        const result = await controller.execute(
          qrCodeStaticRepository,
          logger,
          message,
          ctx,
        );
        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(qrCodeStatic.id);
        expect(result.value.keyId).toBe(qrCodeStatic.keyId);
        expect(result.value.state).toBe(qrCodeStatic.state);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not get the qrCodeStatic if another user has this qrCodeStatic id', async () => {
        const qrCodeStatic =
          await QrCodeStaticFactory.create<QrCodeStaticModel>(
            QrCodeStaticModel.name,
          );
        const userId = faker.datatype.uuid();

        const message: GetByQrCodeStaticIdRequest = {
          id: qrCodeStatic.id,
          userId,
        };

        const testScript = () =>
          controller.execute(qrCodeStaticRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(ForbiddenException);
      });

      it('TC0004 - Should not get if qrCodeStatic is not found', async () => {
        const userId = faker.datatype.uuid();

        const message: GetByQrCodeStaticIdRequest = {
          id: faker.datatype.uuid(),
          userId,
        };

        const testScript = () =>
          controller.execute(qrCodeStaticRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(QrCodeStaticNotFoundException);
      });

      it('TC0005 - Should not get if id is null', async () => {
        const userId = faker.datatype.uuid();

        const message: GetByQrCodeStaticIdRequest = {
          id: null,
          userId,
        };

        const testScript = () =>
          controller.execute(qrCodeStaticRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
