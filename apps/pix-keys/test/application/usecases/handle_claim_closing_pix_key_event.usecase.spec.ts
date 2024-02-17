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
  HandleClaimClosingPixKeyEventUseCase as UseCase,
  PixKeyInvalidStateException,
  PixKeyEventEmitter,
  PixKeyGateway,
  PixKeyClaimNotFoundException,
} from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  PixKeyModel,
  PixKeyClaimModel,
  PixKeyClaimDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory, PixKeyClaimFactory } from '@zro/test/pix-keys/config';
import * as mocksClosingClaim from '@zro/test/pix-keys/config/mocks/closing_claim_pix_key.mock';

describe('HandleClaimClosingPixKeyEventUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;
  let pixKeyClaimRepository: PixKeyClaimRepository;

  const pixKeyEventService: PixKeyEventEmitter =
    createMock<PixKeyEventEmitter>();
  const mockClaimClosedPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.claimClosedPixKey),
  );
  const mockOwnershipReadyPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.ownershipReadyPixKey),
  );

  const pspGateway: PixKeyGateway = createMock<PixKeyGateway>();
  const mockClosingClaimPixKeyPspGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.closingClaim),
  );
  const mockCreatePixKeyPspGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.createPixKey),
  );
  const mockDeletePixKeyPspGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.deletePixKey),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
    pixKeyClaimRepository = new PixKeyClaimDatabaseRepository();
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
      pixKeyClaimRepository,
    );

    return {
      sut,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should start claim closing process (PSP) successfully', async () => {
      mockClosingClaimPixKeyPspGateway.mockImplementation(
        mocksClosingClaim.success,
      );

      const reason = ClaimReasonType.USER_REQUESTED;

      const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
      );

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_CLOSING,
        claim,
      });

      const { sut } = makeSut();

      const result = await sut.execute(pixKey.id, reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.CLAIM_CLOSED);
      expect(mockClaimClosedPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockOwnershipReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockDeletePixKeyPspGateway).toHaveBeenCalledTimes(0);
      expect(mockCreatePixKeyPspGateway).toHaveBeenCalledTimes(0);
      expect(mockClosingClaimPixKeyPspGateway).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should start claim closing process (P2P) successfully', async () => {
      const reason = ClaimReasonType.USER_REQUESTED;
      const thirdPixKey = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.OWNERSHIP_WAITING,
        },
      );

      const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
      );

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        key: thirdPixKey.key,
        state: KeyState.CLAIM_CLOSING,
        claim,
      });

      const { sut } = makeSut();

      const result = await sut.execute(pixKey.id, reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.CLAIM_CLOSED);
      expect(mockClaimClosedPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockOwnershipReadyPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockOwnershipReadyPixKeyEvent).toBeCalledWith({
        ...thirdPixKey.toDomain(),
        state: KeyState.OWNERSHIP_READY,
      });
      expect(mockDeletePixKeyPspGateway).toHaveBeenCalledTimes(1);
      expect(mockCreatePixKeyPspGateway).toHaveBeenCalledTimes(1);
      expect(mockClosingClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not start claim closing when state is not claim closing (PSP)', async () => {
      const reason = ClaimReasonType.USER_REQUESTED;
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.READY,
      });

      const { sut } = makeSut();

      const testScript = () => sut.execute(pixKey.id, reason);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockClaimClosedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockOwnershipReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockDeletePixKeyPspGateway).toHaveBeenCalledTimes(0);
      expect(mockCreatePixKeyPspGateway).toHaveBeenCalledTimes(0);
      expect(mockClosingClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not start claim closing when state is not OWNERSHIP_WAITING (P2P)', async () => {
      const reason = ClaimReasonType.USER_REQUESTED;
      const thirdPixKey = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.DELETED,
        },
      );
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        key: thirdPixKey.key,
        state: KeyState.CLAIM_CLOSING,
      });

      const { sut } = makeSut();

      const testScript = () => sut.execute(pixKey.id, reason);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockClaimClosedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockOwnershipReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockDeletePixKeyPspGateway).toHaveBeenCalledTimes(0);
      expect(mockCreatePixKeyPspGateway).toHaveBeenCalledTimes(0);
      expect(mockClosingClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not start claim closing when claim is not found', async () => {
      mockClosingClaimPixKeyPspGateway.mockImplementation(
        mocksClosingClaim.success,
      );

      const reason = ClaimReasonType.USER_REQUESTED;

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_CLOSING,
        claimId: null,
      });

      const { sut } = makeSut();

      const testScript = () => sut.execute(pixKey.id, reason);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockClaimClosedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockOwnershipReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockDeletePixKeyPspGateway).toHaveBeenCalledTimes(0);
      expect(mockCreatePixKeyPspGateway).toHaveBeenCalledTimes(0);
      expect(mockClosingClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not start claim closing when claim is invalid', async () => {
      mockClosingClaimPixKeyPspGateway.mockImplementation(
        mocksClosingClaim.success,
      );

      const reason = ClaimReasonType.USER_REQUESTED;

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_CLOSING,
        claimId: uuidV4(),
      });

      const { sut } = makeSut();

      const testScript = () => sut.execute(pixKey.id, reason);

      await expect(testScript).rejects.toThrow(PixKeyClaimNotFoundException);
      expect(mockClaimClosedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockOwnershipReadyPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockDeletePixKeyPspGateway).toHaveBeenCalledTimes(0);
      expect(mockCreatePixKeyPspGateway).toHaveBeenCalledTimes(0);
      expect(mockClosingClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
