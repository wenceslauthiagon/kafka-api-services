import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  ClaimReasonType,
  KeyState,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  HandleClaimPendingExpiredPixKeyUseCase as UseCase,
  PixKeyEventEmitter,
} from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('HandleClaimPendingExpiredPixKeyUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;

  const pixKeyEventService: PixKeyEventEmitter =
    createMock<PixKeyEventEmitter>();
  const mockClaimClosingPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.claimClosingPixKey),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should closing key successfully', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_PENDING,
      });

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const result = await usecase.execute(
        pixKey.id,
        ClaimReasonType.DEFAULT_OPERATION,
      );

      expect(result).toBeDefined();
      expect(result.state).toBe(KeyState.CLAIM_CLOSING);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not closing key without reason', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_PENDING,
      });

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const testScript = () => usecase.execute(pixKey.id, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not closing key with READY state', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.READY,
      });

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const result = await usecase.execute(
        pixKey.id,
        ClaimReasonType.DEFAULT_OPERATION,
      );

      expect(result).toBeDefined();
      expect(result).toMatchObject(pixKey.toDomain());
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
