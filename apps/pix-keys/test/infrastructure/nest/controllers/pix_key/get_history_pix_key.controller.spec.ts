import { createMock } from 'ts-auto-mock';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { KeyState, PixKeyHistoryRepository } from '@zro/pix-keys/domain';
import { GetHistoryPixKeyRequest } from '@zro/pix-keys/interface';
import {
  PixKeyHistoryModel,
  PixKeyModel,
  GetHistoryPixKeyMicroserviceController as Controller,
  PixKeyHistoryDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory, PixKeyHistoryFactory } from '@zro/test/pix-keys/config';

describe('GetByIdPixKeyMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let pixKeyHistoryRepository: PixKeyHistoryRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    pixKeyHistoryRepository = new PixKeyHistoryDatabaseRepository();
  });

  beforeEach(() => PixKeyHistoryModel.truncate());

  describe('GetHistoryByIdPixKey', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get pix key using userId as filter successfully', async () => {
        await PixKeyModel.update({ state: KeyState.CANCELED }, { where: {} });
        const { id, state, createdAt, userId } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name);

        const { id: pixKeyHistoryId, pixKeyId } =
          await PixKeyHistoryFactory.create<PixKeyHistoryModel>(
            PixKeyHistoryModel.name,
            {
              pixKeyId: id,
              state,
              createdAt,
              userId,
            },
          );

        const message: GetHistoryPixKeyRequest = {
          pixKey: { userId },
          createdAt: { start: undefined, end: undefined },
          updatedAt: { start: undefined, end: undefined },
        };

        const result = await controller.execute(
          pixKeyHistoryRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value.data).toMatchObject([
          {
            createdAt,
            id: pixKeyHistoryId,
            pixKeyId,
            state,
            userId,
          },
        ]);
      });
    });

    describe('With invvalid parameters', () => {
      it('TC0002 - Should return empty when not found because filter state', async () => {
        await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
          state: KeyState.PENDING,
        });

        const message: GetHistoryPixKeyRequest = {
          state: KeyState.DELETED,
          createdAt: { start: undefined, end: undefined },
          updatedAt: { start: undefined, end: undefined },
        };

        const result = await controller.execute(
          pixKeyHistoryRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value.data).toEqual([]);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
