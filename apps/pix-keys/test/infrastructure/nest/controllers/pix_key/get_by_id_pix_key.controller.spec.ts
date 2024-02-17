import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, FailedEntity } from '@zro/common';
import { KeyState, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PixKeyModel,
  GetByIdPixKeyMicroserviceController as Controller,
  PixKeyDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetByIdPixKeyRequest } from '@zro/pix-keys/interface';

describe('GetByIdPixKeyMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let pixKeyRepository: PixKeyRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  describe('GetByIdPixKey', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get pix key successfully', async () => {
        const { userId, id, key, type, state, createdAt } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name);

        const message: GetByIdPixKeyRequest = {
          userId,
          id,
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
          key,
          type,
          state,
          createdAt,
        });
      });

      it('TC0002 - Should get pix key successfully when failed exists', async () => {
        const failed = new FailedEntity({
          code: 'PIX_KEY_INVALID_STATE',
          message:
            'Não é possível realizar operação com Chave Pix informada. Por favor verifique e tente novamente.',
        });
        const { userId, id, key, type, state, createdAt } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, { failed });

        const message: GetByIdPixKeyRequest = {
          userId,
          id,
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
          key,
          type,
          state,
          createdAt,
          failed,
        });
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not get pix keys canceled', async () => {
        const { userId, id } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CANCELED },
        );

        const message: GetByIdPixKeyRequest = {
          userId,
          id,
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

      it('TC0004 - Should not get pix key other user', async () => {
        const { id } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          {
            state: KeyState.CANCELED,
          },
        );

        const message: GetByIdPixKeyRequest = {
          userId: uuidV4(),
          id,
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
