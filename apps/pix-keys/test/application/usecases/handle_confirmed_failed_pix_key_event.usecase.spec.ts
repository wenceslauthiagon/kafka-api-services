import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, FailedEntity } from '@zro/common';
import { KeyState, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  HandleConfirmedFailedPixKeyEventUseCase as UseCase,
  PixKeyEventEmitter,
} from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('HandleConfirmedFailedPixKeyEventUseCase', () => {
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
    it('TC0001 - Should create Failed EVP key successfully', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CONFIRMED,
      });

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const result = await usecase.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.ERROR);
      expect(mockErrorPixKeyEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should create Failed EVP key with failedMessage successfully', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CONFIRMED,
      });
      const failed = new FailedEntity({
        code: 'PIX_KEY_VERIFICATION_OVERFLOW',
        message: 'Houve um excesso de verificação da chave pix.',
      });

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const result = await usecase.execute(pixKey.id, failed);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.failed.code).toBe(failed.code);
      expect(result.failed.message).toBe(failed.message);
      expect(result.state).toBe(KeyState.ERROR);
      expect(mockErrorPixKeyEvent).toHaveBeenCalledTimes(1);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
