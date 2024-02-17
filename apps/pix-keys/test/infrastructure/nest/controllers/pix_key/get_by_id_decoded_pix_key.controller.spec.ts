import { v4 as uuidV4 } from 'uuid';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { DecodedPixKeyRepository } from '@zro/pix-keys/domain';
import {
  DecodedPixKeyModel,
  GetByIdDecodedPixKeyMicroserviceController as Controller,
  DecodedPixKeyDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { DecodedPixKeyFactory } from '@zro/test/pix-keys/config';
import { createMock } from 'ts-auto-mock';
import { GetByIdDecodedPixKeyRequest } from '@zro/pix-keys/interface';

describe('GetByIdPixKeyMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let decodedPixKeyRepository: DecodedPixKeyRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    decodedPixKeyRepository = new DecodedPixKeyDatabaseRepository();
  });

  describe('GetByIdDecodedPixKey', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get decoded pix key successfully', async () => {
        const { id } = await DecodedPixKeyFactory.create<DecodedPixKeyModel>(
          DecodedPixKeyModel.name,
        );

        const message: GetByIdDecodedPixKeyRequest = {
          id,
        };

        const result = await controller.execute(
          decodedPixKeyRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not get decoded pix keys with invalid id', async () => {
        const message: GetByIdDecodedPixKeyRequest = {
          id: uuidV4(),
        };

        const result = await controller.execute(
          decodedPixKeyRepository,
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
