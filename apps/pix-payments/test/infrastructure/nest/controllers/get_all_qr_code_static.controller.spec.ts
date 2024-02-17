import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger } from '@zro/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QrCodeStaticRepository } from '@zro/pix-payments/domain';
import {
  QrCodeStaticModel,
  GetAllQrCodeStaticByUserMicroserviceController as Controller,
  QrCodeStaticDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { QrCodeStaticFactory } from '@zro/test/pix-payments/config';
import {
  GetAllQrCodeStaticByUserRequest,
  GetAllQrCodeStaticByUserRequestSort,
} from '@zro/pix-payments/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('GetAllQrCodeStaticMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let qrCodeStaticRepository: QrCodeStaticRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    qrCodeStaticRepository = new QrCodeStaticDatabaseRepository();
  });

  describe('GetAllQrCodeStatic', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get qrCodeStatics successfully', async () => {
        const userId = uuidV4();
        await QrCodeStaticFactory.createMany<QrCodeStaticModel>(
          QrCodeStaticModel.name,
          3,
          { userId },
        );

        const message: GetAllQrCodeStaticByUserRequest = {
          userId,
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
        expect(result.value.data).toBeDefined();
        expect(result.value.page).toBeDefined();
        expect(result.value.pageSize).toBeDefined();
        expect(result.value.total).toBeDefined();
        expect(result.value.pageTotal).toBe(
          Math.ceil(result.value.total / result.value.pageSize),
        );
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.createdAt).toBeDefined();
        });
      });

      it('TC0002 - Should get qrCodeStatics successfully with pagination sort', async () => {
        const userId = uuidV4();
        await QrCodeStaticFactory.createMany<QrCodeStaticModel>(
          QrCodeStaticModel.name,
          3,
          { userId },
        );

        const message: GetAllQrCodeStaticByUserRequest = {
          userId,
          sort: GetAllQrCodeStaticByUserRequestSort.CREATED_AT,
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
        expect(result.value.data).toBeDefined();
        expect(result.value.page).toBeDefined();
        expect(result.value.pageSize).toBeDefined();
        expect(result.value.total).toBeDefined();
        expect(result.value.pageTotal).toBe(
          Math.ceil(result.value.total / result.value.pageSize),
        );
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.createdAt).toBeDefined();
        });
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
