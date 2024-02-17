import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { KeyState, KeyType, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  HandleConfirmedPixKeyEventUseCase as UseCase,
  PixKeyEventEmitter,
  PixKeyGateway,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import * as createPixKeyPspGatewayMock from '@zro/test/pix-keys/config/mocks/create_pix_key.mock';

describe('HandleConfirmedPixKeyEventUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;

  const pixKeyEventService: PixKeyEventEmitter =
    createMock<PixKeyEventEmitter>();
  const mockReadyPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.addReadyPixKey),
  );
  const mockPortabilityPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.portabilityPendingPixKey),
  );
  const mockOwnershipPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.ownershipPendingPixKey),
  );
  const mockOwnershipConflictPixKeyEvent: jest.Mock = On(
    pixKeyEventService,
  ).get(method((mock) => mock.ownershipConflictPixKey));

  const pspGateway: PixKeyGateway = createMock<PixKeyGateway>();
  const mockCreatePixKeyPspGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.createPixKey),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const ZRO_ISPB = '26264220';
    const sut = new UseCase(
      logger,
      pixKeyRepository,
      pixKeyEventService,
      pspGateway,
      ZRO_ISPB,
    );

    return {
      sut,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should create PHONE key successfully', async () => {
      mockCreatePixKeyPspGateway.mockImplementation(
        createPixKeyPspGatewayMock.success,
      );

      const { sut } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CONFIRMED,
        type: KeyType.PHONE,
      });

      const result = await sut.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.ADD_KEY_READY);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockPortabilityPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockOwnershipPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCreatePixKeyPspGateway).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should create EVP key successfully', async () => {
      mockCreatePixKeyPspGateway.mockImplementation(
        createPixKeyPspGatewayMock.success,
      );

      const { sut } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CONFIRMED,
        type: KeyType.EVP,
        key: null,
      });

      const result = await sut.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).not.toBeNull();
      expect(result.state).toBe(KeyState.ADD_KEY_READY);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockPortabilityPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockOwnershipPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCreatePixKeyPspGateway).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should not create if the key already exists', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.ADD_KEY_READY,
      });

      const { sut } = makeSut();

      const result = await sut.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.ADD_KEY_READY);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPortabilityPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockOwnershipPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCreatePixKeyPspGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should create key with portability state', async () => {
      mockCreatePixKeyPspGateway.mockImplementation(
        createPixKeyPspGatewayMock.portability,
      );

      const { sut } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CONFIRMED,
      });

      const result = await sut.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.PORTABILITY_PENDING);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPortabilityPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockOwnershipPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCreatePixKeyPspGateway).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should create key with ownership state (PSP)', async () => {
      mockCreatePixKeyPspGateway.mockImplementation(
        createPixKeyPspGatewayMock.thirdParty,
      );

      const { sut } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CONFIRMED,
      });

      const result = await sut.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.OWNERSHIP_PENDING);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPortabilityPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockOwnershipPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockCreatePixKeyPspGateway).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should create key with ownership state (P2P)', async () => {
      const thirdPixKey = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.ADD_KEY_READY,
          type: KeyType.PHONE,
        },
      );
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        key: thirdPixKey.key,
        state: KeyState.CONFIRMED,
        type: KeyType.PHONE,
      });

      const { sut } = makeSut();

      const result = await sut.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.OWNERSHIP_PENDING);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPortabilityPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockOwnershipPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockCreatePixKeyPspGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0007 - Should not create key with ownership state is not CONFIRMED', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_PENDING,
      });

      const { sut } = makeSut();

      const testScript = () => sut.execute(pixKey.id);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPortabilityPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockOwnershipPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCreatePixKeyPspGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should not create key with ownership state is not READY (P2P)', async () => {
      const thirdPixKey = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        { state: KeyState.CLAIM_PENDING, type: KeyType.PHONE },
      );
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        key: thirdPixKey.key,
        state: KeyState.CONFIRMED,
        type: KeyType.PHONE,
      });

      const { sut } = makeSut();

      const result = await sut.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.OWNERSHIP_CONFLICT);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPortabilityPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockOwnershipPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCreatePixKeyPspGateway).toHaveBeenCalledTimes(0);
      expect(mockOwnershipConflictPixKeyEvent).toHaveBeenCalledTimes(1);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
