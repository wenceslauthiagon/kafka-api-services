import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { KeyState, KeyType, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  SyncPendingExpiredPixKeyUseCase as UseCase,
  PixKeyEventEmitter,
} from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

const TIMESTAMP = 30 * 60; // 30 minutes.

describe('SyncPendingExpiredPixKeyUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;

  const pixKeyEventService: PixKeyEventEmitter =
    createMock<PixKeyEventEmitter>();
  const mockPendingExpiredPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.pendingExpiredPixKey),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should handle key PHONE successfully', async () => {
      await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PENDING,
        type: KeyType.PHONE,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        TIMESTAMP,
      );

      const result = await usecase.execute();

      expect(result).toBeDefined();
      result.forEach((res) => {
        expect(res.state).toBe(KeyState.PENDING);
      });
      expect(mockPendingExpiredPixKeyEvent).toHaveBeenCalledTimes(
        result.length,
      );
    });

    it('TC0002 - Should handle key EMAIL successfully', async () => {
      await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PENDING,
        type: KeyType.EMAIL,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        TIMESTAMP,
      );

      const result = await usecase.execute();

      expect(result).toBeDefined();
      result.forEach((res) => {
        expect(res.state).toBe(KeyState.PENDING);
      });
      expect(mockPendingExpiredPixKeyEvent).toHaveBeenCalledTimes(
        result.length,
      );
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
