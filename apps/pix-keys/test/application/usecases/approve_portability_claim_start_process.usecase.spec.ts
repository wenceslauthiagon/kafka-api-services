import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { KeyState, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  ApprovePortabilityClaimStartProcessUseCase as UseCase,
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('ApprovePortabilityClaimStartProcessUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;

  const pixKeyEventService: PixKeyEventEmitter =
    createMock<PixKeyEventEmitter>();
  const mockPortabilityOpenedPixKeyEvent: jest.Mock = On(
    pixKeyEventService,
  ).get(method((mock) => mock.portabilityOpenedPixKey));

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should start portability process successfully', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.PORTABILITY_PENDING,
        },
      );
      const user = new UserEntity({ uuid: userId });

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);
      const result = await usecase.execute(user, id);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.PORTABILITY_OPENED);

      expect(mockPortabilityOpenedPixKeyEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should start portability process with already portability opened key successfully', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.PORTABILITY_OPENED,
        },
      );
      const user = new UserEntity({ uuid: userId });

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);
      const result = await usecase.execute(user, id);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.PORTABILITY_OPENED);

      expect(mockPortabilityOpenedPixKeyEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not start portability process on a canceled key', async () => {
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.CANCELED,
        },
      );
      const user = new UserEntity({ uuid: userId });

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);
      const testScript = () => usecase.execute(user, id);

      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);

      expect(mockPortabilityOpenedPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not start portability process with a key in invalid state', async () => {
      const states = Object.values(KeyState)
        .filter(
          (state) =>
            ![
              KeyState.PORTABILITY_PENDING,
              KeyState.PORTABILITY_OPENED,
              KeyState.CANCELED,
            ].includes(state),
        )
        .map((state) => ({ state }));

      const keys = await PixKeyFactory.createMany<PixKeyModel>(
        PixKeyModel.name,
        states.length,
        states,
      );

      for (const key of keys) {
        const user = new UserEntity({ uuid: key.userId });

        const usecase = new UseCase(
          logger,
          pixKeyRepository,
          pixKeyEventService,
        );
        const testScript = () => usecase.execute(user, key.id);

        await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      }

      expect(mockPortabilityOpenedPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not start portability process on a key owned by another user', async () => {
      const { id } = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_PENDING,
      });
      const user = new UserEntity({ uuid: uuidV4() });

      const usecase = new UseCase(logger, pixKeyRepository, pixKeyEventService);
      const testScript = () => usecase.execute(user, id);

      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);

      expect(mockPortabilityOpenedPixKeyEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
