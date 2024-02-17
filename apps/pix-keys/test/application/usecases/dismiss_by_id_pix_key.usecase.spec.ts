import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { KeyState, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  DismissByIdPixKeyUseCase as UseCase,
  PixKeyEventEmitter,
  PixKeyInvalidStateException,
  PixKeyNotFoundException,
} from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('DismissByIdPixKeyUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;

  const pixKeyEventService: PixKeyEventEmitter =
    createMock<PixKeyEventEmitter>();
  const mockReadyPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.readyPixKey),
  );
  const mockCanceledPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.canceledPixKey),
  );
  const mockClaimPendingPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.claimPendingPixKey),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should dismiss key in PORTABILITY_READY state successfully to ready state', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.PORTABILITY_READY,
        },
      );

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.READY);
      expect(result.canceledAt).toBeNull();
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should dismiss key in OWNERSHIP_READY state successfully to ready state', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.OWNERSHIP_READY,
        },
      );

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.READY);
      expect(result.canceledAt).toBeNull();
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should dismiss key in ADD_KEY_READY state successfully to ready state', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.ADD_KEY_READY,
        },
      );

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.READY);
      expect(result.canceledAt).toBeNull();
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should dismiss key in PORTABILITY_CANCELED state successfully to canceled state', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.PORTABILITY_CANCELED,
        },
      );

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.CANCELED);
      expect(result.canceledAt).toBeDefined();
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockClaimPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should dismiss key in OWNERSHIP_CANCELED state successfully to canceled state', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.OWNERSHIP_CANCELED,
        },
      );

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.CANCELED);
      expect(result.canceledAt).toBeDefined();
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockClaimPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should dismiss key in DELETED state successfully to canceled state', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.DELETED,
        },
      );

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.CANCELED);
      expect(result.canceledAt).toBeDefined();
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockClaimPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should dismiss key in CLAIM_NOT_CONFIRMED state successfully to CLAIM_PENDING state', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        { state: KeyState.CLAIM_NOT_CONFIRMED, code: null },
      );

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.CLAIM_PENDING);
      expect(result.canceledAt).toBeDefined();
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimPendingPixKeyEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0008 - Should dismiss key in NOT_CONFIRMED state successfully to canceled state', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.NOT_CONFIRMED,
        },
      );

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.CANCELED);
      expect(result.canceledAt).toBeDefined();
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockClaimPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0009 - Should fail to dismiss a key in non expected state', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.PORTABILITY_PENDING,
        },
      );

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const user = new UserEntity({ uuid: userId });

      const testScript = () => usecase.execute(user, id);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0010 - Should fail to dismiss a key when id is missing', async () => {
      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const user = new UserEntity({ uuid: uuidV4() });

      const testScript = () => usecase.execute(user, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0011 - Should fail to dismiss a key when user is not key owner', async () => {
      const { id } = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name);

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const user = new UserEntity({ uuid: uuidV4() });

      const testScript = () => usecase.execute(user, id);

      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0012 - Should fail to dismiss a key when key is not found', async () => {
      const { userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
      );

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const user = new UserEntity({ uuid: userId });

      const testScript = () => usecase.execute(user, uuidV4());

      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
