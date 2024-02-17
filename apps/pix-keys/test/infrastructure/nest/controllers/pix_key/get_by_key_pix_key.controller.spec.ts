import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PixKeyModel,
  GetByKeyPixKeyMicroserviceController as Controller,
  PixKeyDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetByKeyPixKeyRequest } from '@zro/pix-keys/interface';

describe('GetByKeyPixKeyMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let pixKeyRepository: PixKeyRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  describe('GetByKeyPixKey', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get pix key using key successfully', async () => {
        const { id, state, key, type, createdAt } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name);

        const message: GetByKeyPixKeyRequest = {
          key,
        };

        const result = await controller.execute(
          pixKeyRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toMatchObject({
          id,
          state,
          key,
          type,
          createdAt,
        });
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should return undefined when not found', async () => {
        await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name);

        const message: GetByKeyPixKeyRequest = {
          key: 'test',
        };

        const result = await controller.execute(
          pixKeyRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeNull();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
