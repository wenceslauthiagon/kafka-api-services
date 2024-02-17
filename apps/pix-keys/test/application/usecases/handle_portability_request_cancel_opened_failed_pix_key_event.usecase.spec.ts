import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { KeyState, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  HandlePortabilityRequestCancelOpenedFailedPixKeyEventUseCase as UseCase,
  PixKeyEventEmitter,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('HandlePortabilityRequestCancelOpenedFailedPixKeyEventUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;

  const pixKeyEventService: PixKeyEventEmitter =
    createMock<PixKeyEventEmitter>();
  const mockErrorPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.errorPixKey),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should fail successfully', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_REQUEST_CANCEL_OPENED,
      });

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const result = await usecase.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.ERROR);
      expect(mockErrorPixKeyEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should not do anything', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_REQUEST_CANCEL_STARTED,
      });

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const result = await usecase.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(pixKey.state);
      expect(mockErrorPixKeyEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not fail when state is incorrect', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.READY,
      });

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const testScript = () => usecase.execute(pixKey.id);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockErrorPixKeyEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
