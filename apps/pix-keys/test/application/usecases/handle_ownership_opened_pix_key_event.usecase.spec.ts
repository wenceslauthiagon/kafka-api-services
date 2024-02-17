import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { KeyState, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  HandleOwnershipOpenedPixKeyEventUseCase as UseCase,
  PixKeyEventEmitter,
  PixKeyInvalidStateException,
  PixKeyGateway,
} from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import * as mocks from '@zro/test/pix-keys/config/mocks/create_ownership_claim_pix_key.mock';

describe('HandleOwnershipOpenedPixKeyEventUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;

  const ZRO_ISPB = '26264220';

  const pixKeyEventService: PixKeyEventEmitter =
    createMock<PixKeyEventEmitter>();
  const mockOwnershipStartedPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.ownershipStartedPixKey),
  );
  const mockClaimPendingPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.claimPendingPixKey),
  );
  const mockOwnershipWaitingPixKey: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.ownershipWaitingPixKey),
  );

  const pspGateway: PixKeyGateway = createMock<PixKeyGateway>();
  const mockCreateOwnershipClaimPixKeyPspGateway: jest.Mock = On(
    pspGateway,
  ).get(method((mock) => mock.createOwnershipClaim));

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should start ownership process successfully (PSP)', async () => {
      mockCreateOwnershipClaimPixKeyPspGateway.mockImplementation(
        mocks.success,
      );

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_OPENED,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        pspGateway,
        ZRO_ISPB,
      );

      const result = await usecase.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.OWNERSHIP_STARTED);
      expect(mockOwnershipStartedPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockClaimPendingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateOwnershipClaimPixKeyPspGateway).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should do not do anything when state is ownership started', async () => {
      mockCreateOwnershipClaimPixKeyPspGateway.mockImplementation(
        mocks.success,
      );

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_STARTED,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        pspGateway,
        ZRO_ISPB,
      );

      const result = await usecase.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.OWNERSHIP_STARTED);
      expect(mockOwnershipStartedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimPendingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateOwnershipClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should start ownership process (P2P) successfully', async () => {
      const thirdPixKey = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.READY,
        },
      );
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        key: thirdPixKey.key,
        state: KeyState.OWNERSHIP_OPENED,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        pspGateway,
        ZRO_ISPB,
      );

      const result = await usecase.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.OWNERSHIP_WAITING);
      expect(mockOwnershipStartedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockOwnershipWaitingPixKey).toHaveBeenCalledTimes(1);
      expect(mockClaimPendingPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockClaimPendingPixKeyEvent).toBeCalledWith({
        ...thirdPixKey.toDomain(),
        state: KeyState.CLAIM_PENDING,
      });
      expect(mockCreateOwnershipClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0004 - Should not start ownership process when state is not ownership opened', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.READY,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        pspGateway,
        ZRO_ISPB,
      );

      const testScript = () => usecase.execute(pixKey.id);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockOwnershipStartedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimPendingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateOwnershipClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not start ownership when state is not READY (P2P)', async () => {
      const thirdPixKey = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.PORTABILITY_PENDING,
        },
      );
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        key: thirdPixKey.key,
        state: KeyState.OWNERSHIP_OPENED,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        pspGateway,
        ZRO_ISPB,
      );

      const testScript = () => usecase.execute(pixKey.id);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockOwnershipStartedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimPendingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateOwnershipClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
