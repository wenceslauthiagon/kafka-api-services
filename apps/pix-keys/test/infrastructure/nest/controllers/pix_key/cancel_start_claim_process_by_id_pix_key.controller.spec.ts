import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { KeyState, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PixKeyModel,
  CancelStartClaimProcessByIdPixKeyMicroserviceController as Controller,
  PixKeyDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  PixKeyInvalidStateException,
  PixKeyNotFoundException,
} from '@zro/pix-keys/application';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import { CancelStartClaimProcessByIdPixKeyRequest } from '@zro/pix-keys/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('CancelStartClaimProcessByIdPixKeyMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let pixKeyRepository: PixKeyRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  describe('CancelStartClaimProcessByIdPixKey', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should cancel a process successfully', async () => {
        const { userId, id, key, type, createdAt } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
            state: KeyState.OWNERSHIP_PENDING,
          });

        const message: CancelStartClaimProcessByIdPixKeyRequest = {
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
          state: KeyState.CANCELED,
          createdAt,
        });
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not cancel a process when id is missing', async () => {
        const { userId } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
        );

        const message: CancelStartClaimProcessByIdPixKeyRequest = {
          userId,
          id: null,
        };

        const testScript = () =>
          controller.execute(pixKeyRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });

      it('TC0003 - Should not cancel a process when id is not uuid', async () => {
        const { userId } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
        );

        const message: CancelStartClaimProcessByIdPixKeyRequest = {
          userId,
          id: 'x',
        };

        const testScript = () =>
          controller.execute(pixKeyRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });

      it('TC0004 - Should not cancel a process when key is not found', async () => {
        const { userId } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
        );

        const message: CancelStartClaimProcessByIdPixKeyRequest = {
          userId,
          id: uuidV4(),
        };

        const testScript = () =>
          controller.execute(pixKeyRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
      });

      it('TC0005 - Should not cancel a process when key is canceled', async () => {
        const { userId, id } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CANCELED },
        );

        const message: CancelStartClaimProcessByIdPixKeyRequest = {
          userId,
          id,
        };

        const testScript = () =>
          controller.execute(pixKeyRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
      });

      it('TC0006 - Should not cancel a process in non expected state', async () => {
        const { userId, id } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
        );

        const message: CancelStartClaimProcessByIdPixKeyRequest = {
          userId,
          id,
        };

        const testScript = () =>
          controller.execute(pixKeyRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
