import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  DecodedPixKeyState,
  DecodedPixKeyEntity,
  DecodedPixKeyRepository,
} from '@zro/pix-keys/domain';
import { UserEntity } from '@zro/users/domain';
import {
  HandleErrorDecodedPixKeyEventUseCase as UseCase,
  InvalidStateDecodedPixKeyException,
} from '@zro/pix-keys/application';
import { UserFactory } from '@zro/test/users/config';
import { DecodedPixKeyFactory } from '@zro/test/pix-keys/config';

describe('HandleErrorDecodedPixKeyEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const ZRO_ISPB = '12345678';

  const decodedPixKeyRepository: DecodedPixKeyRepository =
    createMock<DecodedPixKeyRepository>();

  const mockGetDecodedPixKeyById: jest.Mock = On(decodedPixKeyRepository).get(
    method((mock) => mock.getById),
  );

  describe('With valid parameters', () => {
    it('TC0001 - Should create a local decoded pix key successfully', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { user },
        );

      const usecase = new UseCase(logger, decodedPixKeyRepository, ZRO_ISPB);
      const result = await usecase.execute(
        decodedPixKey.id,
        user,
        decodedPixKey.key,
        decodedPixKey.type,
        DecodedPixKeyState.ERROR,
      );

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.uuid).toBe(user.uuid);
      expect(result.state).toBe(DecodedPixKeyState.ERROR);
      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not create a local decoded pix key if id is empty', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { user },
        );

      const usecase = new UseCase(logger, decodedPixKeyRepository, ZRO_ISPB);

      const testScript = () =>
        usecase.execute(
          null,
          user,
          decodedPixKey.key,
          decodedPixKey.type,
          DecodedPixKeyState.ERROR,
        );

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create a local decoded pix key if user is empty', async () => {
      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
        );

      const usecase = new UseCase(logger, decodedPixKeyRepository, ZRO_ISPB);

      const testScript = () =>
        usecase.execute(
          decodedPixKey.id,
          null,
          decodedPixKey.key,
          decodedPixKey.type,
          DecodedPixKeyState.ERROR,
        );

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create a local decoded pix key if key is empty', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { user },
        );

      const usecase = new UseCase(logger, decodedPixKeyRepository, ZRO_ISPB);

      const testScript = () =>
        usecase.execute(
          decodedPixKey.id,
          user,
          null,
          decodedPixKey.type,
          DecodedPixKeyState.ERROR,
        );

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not create a local decoded pix key if state is empty', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { user },
        );

      const usecase = new UseCase(logger, decodedPixKeyRepository, ZRO_ISPB);

      const testScript = () =>
        usecase.execute(
          decodedPixKey.id,
          user,
          decodedPixKey.key,
          decodedPixKey.type,
          null,
        );

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not create a local decoded pix key if state invalid', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { user },
        );

      const usecase = new UseCase(logger, decodedPixKeyRepository, ZRO_ISPB);

      const testScript = () =>
        usecase.execute(
          decodedPixKey.id,
          user,
          decodedPixKey.key,
          decodedPixKey.type,
          DecodedPixKeyState.CONFIRMED,
        );

      await expect(testScript).rejects.toThrow(
        InvalidStateDecodedPixKeyException,
      );
      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(1);
    });
  });
});
