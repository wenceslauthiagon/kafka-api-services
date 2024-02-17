import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { PixKeyFactory, PixKeyHistoryFactory } from '@zro/test/pix-keys/config';
import {
  PixKeyHistoryRepository,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  HistoryPixKeyNestObserver,
  PixKeyHistoryModel,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { HandleHistoryPixKeyEventRequest } from '@zro/pix-keys/interface';

describe('HistoryPixKeyNestObserver', () => {
  let module: TestingModule;
  let controller: HistoryPixKeyNestObserver;

  const makeSut = () => {
    const {
      pixKeyHistoryRepository,
      mockHistoryPixKeyCreateRepository,
      pixKeyRepository,
      mockPixKeyGetRepository,
    } = mockRepository();

    return {
      logger,
      pixKeyHistoryRepository,
      mockHistoryPixKeyCreateRepository,
      pixKeyRepository,
      mockPixKeyGetRepository,
    };
  };

  const mockRepository = () => {
    const pixKeyHistoryRepository: PixKeyHistoryRepository =
      createMock<PixKeyHistoryRepository>();
    const mockHistoryPixKeyCreateRepository: jest.Mock = On(
      pixKeyHistoryRepository,
    ).get(method((mock) => mock.create));

    const pixKeyRepository: PixKeyRepository = createMock<PixKeyRepository>();
    const mockPixKeyGetRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.getById),
    );
    return {
      pixKeyHistoryRepository,
      mockHistoryPixKeyCreateRepository,
      pixKeyRepository,
      mockPixKeyGetRepository,
    };
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<HistoryPixKeyNestObserver>(
      HistoryPixKeyNestObserver,
    );
  });

  describe('HandleHistoryPixKeyEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle history pix key event successfully', async () => {
        const {
          logger,
          pixKeyHistoryRepository,
          pixKeyRepository,
          mockHistoryPixKeyCreateRepository,
          mockPixKeyGetRepository,
        } = makeSut();

        const { userId, id, state, createdAt } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name);
        const { id: pixHistoryId } =
          await PixKeyHistoryFactory.create<PixKeyHistoryModel>(
            PixKeyHistoryModel.name,
          );

        mockPixKeyGetRepository.mockResolvedValue({
          userId,
          id,
          state,
          createdAt,
        });
        mockHistoryPixKeyCreateRepository.mockResolvedValue({
          id: pixHistoryId,
          pixKeyId: id,
          state,
          createdAt,
          pixKey: { id },
        });

        const message: HandleHistoryPixKeyEventRequest = {
          userId,
          id,
          state,
        };

        await controller.handleHistoryPixKeyEvent(
          message,
          logger,
          pixKeyRepository,
          pixKeyHistoryRepository,
        );

        expect(mockPixKeyGetRepository).toHaveBeenCalledTimes(1);
        expect(mockHistoryPixKeyCreateRepository).toHaveBeenCalledTimes(1);
        expect(mockPixKeyGetRepository).toHaveBeenCalledWith(id);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
