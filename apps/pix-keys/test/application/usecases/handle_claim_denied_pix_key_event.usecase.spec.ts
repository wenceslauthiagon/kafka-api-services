import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  ClaimReasonType,
  KeyState,
  PixKeyRepository,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import {
  HandleClaimDeniedPixKeyEventUseCase as UseCase,
  PixKeyEventEmitter,
  PixKeyInvalidStateException,
  PixKeyGateway,
  PixKeyClaimNotFoundException,
} from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  PixKeyModel,
  PixKeyClaimDatabaseRepository,
  PixKeyClaimModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory, PixKeyClaimFactory } from '@zro/test/pix-keys/config';
import * as mocks from '@zro/test/pix-keys/config/mocks/denied_claim_pix_key.mock';

describe('HandleClaimDeniedPixKeyEventUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;
  let pixKeyClaimRepository: PixKeyClaimRepository;

  const ZRO_ISPB = '26264220';

  const pixKeyEventService: PixKeyEventEmitter =
    createMock<PixKeyEventEmitter>();
  const mockReadyPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.readyPixKey),
  );
  const mockOwnershipCanceledPixKeyEvent: jest.Mock = On(
    pixKeyEventService,
  ).get(method((mock) => mock.ownershipCanceledPixKey));

  const pspGateway: PixKeyGateway = createMock<PixKeyGateway>();
  const mockDeniedClaimPixKeyPspGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.deniedClaim),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
    pixKeyClaimRepository = new PixKeyClaimDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should start claim denied process (PSP) successfully', async () => {
      mockDeniedClaimPixKeyPspGateway.mockImplementation(mocks.success);
      const reason = ClaimReasonType.USER_REQUESTED;

      const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
      );

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_DENIED,
        claimId: claim.id,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        pspGateway,
        ZRO_ISPB,
        pixKeyClaimRepository,
      );

      const result = await usecase.execute(pixKey.id, reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.READY);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockOwnershipCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockDeniedClaimPixKeyPspGateway).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should do not do anything when state is ready', async () => {
      mockDeniedClaimPixKeyPspGateway.mockImplementation(mocks.success);
      const reason = ClaimReasonType.USER_REQUESTED;
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.READY,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        pspGateway,
        ZRO_ISPB,
        pixKeyClaimRepository,
      );

      const result = await usecase.execute(pixKey.id, reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.READY);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockOwnershipCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockDeniedClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should start claim denied process (P2P) successfully', async () => {
      const reason = ClaimReasonType.USER_REQUESTED;
      const thirdPixKey = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.OWNERSHIP_WAITING,
        },
      );
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        key: thirdPixKey.key,
        state: KeyState.CLAIM_DENIED,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        pspGateway,
        ZRO_ISPB,
        pixKeyClaimRepository,
      );

      const result = await usecase.execute(pixKey.id, reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.READY);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockOwnershipCanceledPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockOwnershipCanceledPixKeyEvent).toBeCalledWith({
        ...thirdPixKey.toDomain(),
        state: KeyState.OWNERSHIP_CANCELED,
      });
      expect(mockDeniedClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0004 - Should not start claim denied process when state is not CLAIM_DENIED (PSP)', async () => {
      const reason = ClaimReasonType.USER_REQUESTED;
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_PENDING,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        pspGateway,
        ZRO_ISPB,
        pixKeyClaimRepository,
      );

      const testScript = () => usecase.execute(pixKey.id, reason);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockOwnershipCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockDeniedClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not start claim denied when state is not OWNERSHIP_WAITING (P2P)', async () => {
      const reason = ClaimReasonType.USER_REQUESTED;
      const thirdPixKey = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.PENDING,
        },
      );
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        key: thirdPixKey.key,
        state: KeyState.CLAIM_DENIED,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        pspGateway,
        ZRO_ISPB,
        pixKeyClaimRepository,
      );

      const testScript = () => usecase.execute(pixKey.id, reason);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockOwnershipCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockDeniedClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not start claim closing when claim is null', async () => {
      mockDeniedClaimPixKeyPspGateway.mockImplementation(mocks.success);

      const reason = ClaimReasonType.USER_REQUESTED;

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_DENIED,
        claimId: null,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        pspGateway,
        ZRO_ISPB,
        pixKeyClaimRepository,
      );

      const testScript = () => usecase.execute(pixKey.id, reason);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockOwnershipCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockDeniedClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not start claim closing when claim is invalid', async () => {
      mockDeniedClaimPixKeyPspGateway.mockImplementation(mocks.success);

      const reason = ClaimReasonType.USER_REQUESTED;

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_DENIED,
        claimId: uuidV4(),
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        pspGateway,
        ZRO_ISPB,
        pixKeyClaimRepository,
      );

      const testScript = () => usecase.execute(pixKey.id, reason);

      await expect(testScript).rejects.toThrow(PixKeyClaimNotFoundException);
      expect(mockReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockOwnershipCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockDeniedClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
