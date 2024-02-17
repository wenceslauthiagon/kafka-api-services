import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { KeyState, KeyType, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  HandlePendingExpiredPixKeyUseCase as UseCase,
  PixKeyEventEmitter,
} from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('HandlePendingExpiredPixKeyUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;

  const pixKeyEventService: PixKeyEventEmitter =
    createMock<PixKeyEventEmitter>();
  const mockCanceledPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.canceledPixKey),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should cancel key successfully', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PENDING,
        type: KeyType.EMAIL,
      });

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const result = await usecase.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(KeyState.CANCELED);
      expect(result.canceledAt).not.toBeNull();
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not cancel key CPF', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PENDING,
        type: KeyType.CPF,
      });

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const result = await usecase.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result).toMatchObject(pixKey.toDomain());
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not cancel key EMAIL with READY state', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.READY,
        type: KeyType.EMAIL,
      });

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const result = await usecase.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result).toMatchObject(pixKey.toDomain());
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not cancel key PHONE with CONFIRMED state', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CONFIRMED,
        type: KeyType.PHONE,
      });

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const result = await usecase.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result).toMatchObject(pixKey.toDomain());
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
