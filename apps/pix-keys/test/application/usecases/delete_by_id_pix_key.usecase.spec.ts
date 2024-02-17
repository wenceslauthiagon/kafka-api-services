import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  PixKeyReasonType,
  KeyState,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  DeleteByIdPixKeyUseCase as UseCase,
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

describe('DeleteByIdPixKeyUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;

  const pixKeyEventService: PixKeyEventEmitter =
    createMock<PixKeyEventEmitter>();
  const mockDeletingPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.deletingPixKey),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should delete EVP key successfully', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        { state: KeyState.READY },
      );

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(
        user,
        id,
        PixKeyReasonType.USER_REQUESTED,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.DELETING);
      expect(result.deletedByReason).toBe(PixKeyReasonType.USER_REQUESTED);
      expect(result.deletedAt).toBeNull();
      expect(mockDeletingPixKeyEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should delete Error EVP key successfully', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        { state: KeyState.ERROR },
      );

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(
        user,
        id,
        PixKeyReasonType.USER_REQUESTED,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.DELETING);
      expect(result.deletedByReason).toBe(PixKeyReasonType.USER_REQUESTED);
      expect(result.deletedAt).toBeNull();
      expect(mockDeletingPixKeyEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should return an EVP key in deleting successfully', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        { state: KeyState.DELETING },
      );

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(
        user,
        id,
        PixKeyReasonType.USER_REQUESTED,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.DELETING);
      expect(result.deletedByReason).toBeNull();
      expect(result.deletedAt).toBeNull();
      expect(mockDeletingPixKeyEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0004 - Should not delete an canceled EVP key', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        { state: KeyState.CANCELED },
      );

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const user = new UserEntity({ uuid: userId });

      const testScript = () =>
        usecase.execute(user, id, PixKeyReasonType.USER_REQUESTED);

      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
      expect(mockDeletingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not delete an invalid state EVP key', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        { state: KeyState.CONFIRMED },
      );

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);

      const user = new UserEntity({ uuid: userId });

      const testScript = () =>
        usecase.execute(user, id, PixKeyReasonType.USER_REQUESTED);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockDeletingPixKeyEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
