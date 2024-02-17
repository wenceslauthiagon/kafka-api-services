import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PixKeyModel,
  GetAllPixKeyMicroserviceController as Controller,
  PixKeyDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetAllPixKeyRequest } from '@zro/pix-keys/interface';

describe('GetAllPixKeyMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let pixKeyRepository: PixKeyRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  describe('GetAllPixKey', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get pix keys successfully with user', async () => {
        const { userId } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
        );

        const message: GetAllPixKeyRequest = {
          userId,
        };

        const result = await controller.execute(
          pixKeyRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.data).toBeDefined();
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.createdAt).toBeDefined();
        });
      });

      it('TC0002 - Should get many pix keys successfully without user', async () => {
        await PixKeyFactory.createMany<PixKeyModel>(PixKeyModel.name, 3);

        const message: GetAllPixKeyRequest = {
          userId: undefined,
        };

        const result = await controller.execute(
          pixKeyRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.data).toBeDefined();
        expect(result.value.total).toBeDefined();
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.createdAt).toBeDefined();
        });
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not get pix keys other user', async () => {
        await PixKeyFactory.createMany<PixKeyModel>(PixKeyModel.name, 2);

        const message: GetAllPixKeyRequest = {
          userId: uuidV4(),
        };

        const result = await controller.execute(
          pixKeyRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.data).toBeDefined();
        expect(result.value.page).toBe(1);
        expect(result.value.pageSize).toBe(20);
        expect(result.value.total).toBe(0);
        expect(result.value.pageTotal).toBe(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
