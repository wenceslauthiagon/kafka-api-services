import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { KeyState, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  CancelStartClaimProcessByIdPixKeyUseCase as UseCase,
  PixKeyInvalidStateException,
  PixKeyNotFoundException,
} from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('CancelStartClaimProcessByIdPixKeyUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  describe('With invalid parameters', () => {
    it('TC0001 - Should cancel a process key successfully', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_PENDING,
      });

      const usecase = new UseCase(logger, pixKeyRepository);

      const user = new UserEntity({ uuid: pixKey.userId });

      const result = await usecase.execute(user, pixKey.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.user.uuid).toBe(pixKey.userId);
      expect(result.state).toBe(KeyState.CANCELED);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not cancel a process with canceled key', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.CANCELED,
        },
      );

      const usecase = new UseCase(logger, pixKeyRepository);

      const user = new UserEntity({ uuid: userId });

      const testScript = () => usecase.execute(user, id);

      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
    });

    it('TC0003 - Should not cancel a process with ready key', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.READY,
        },
      );

      const usecase = new UseCase(logger, pixKeyRepository);

      const user = new UserEntity({ uuid: userId });

      const testScript = () => usecase.execute(user, id);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
    });

    it('TC0004 - Should not cancel a process without user and key id', async () => {
      const usecase = new UseCase(logger, pixKeyRepository);

      const testScript = () => usecase.execute(null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });

    it('TC0005 - Should not cancel a process without key id', async () => {
      const usecase = new UseCase(logger, pixKeyRepository);

      const user = new UserEntity({ uuid: uuidV4() });

      const testScript = () => usecase.execute(user, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });

    it('TC0006 - Should not cancel a process other user', async () => {
      const { id } = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name);

      const usecase = new UseCase(logger, pixKeyRepository);

      const user = new UserEntity({ uuid: uuidV4() });

      const testScript = () => usecase.execute(user, id);

      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
