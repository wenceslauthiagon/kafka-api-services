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
  HandlePortabilityRequestConfirmOpenedPixKeyEventUseCase as UseCase,
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
import * as confirmPixKeyPspGatewayMock from '@zro/test/pix-keys/config/mocks/confirm_portability_claim_pix_key.mock';

describe('HandlePortabilityRequestConfirmOpenedPixKeyEventUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;
  let pixKeyClaimRepository: PixKeyClaimRepository;
  const ZRO_ISPB = '26264220';

  const pixKeyEventService: PixKeyEventEmitter =
    createMock<PixKeyEventEmitter>();
  const mockConfirmClaimPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.portabilityRequestConfirmStartedPixKey),
  );
  const pspGateway: PixKeyGateway = createMock<PixKeyGateway>();
  const mockConfirmClaimPixKeyPspGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.confirmPortabilityClaim),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
    pixKeyClaimRepository = new PixKeyClaimDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should confirm EVP key successfully', async () => {
      mockConfirmClaimPixKeyPspGateway.mockImplementation(
        confirmPixKeyPspGatewayMock.success,
      );

      const reason = ClaimReasonType.USER_REQUESTED;

      const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
      );

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_REQUEST_CONFIRM_OPENED,
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
      expect(result.state).toBe(KeyState.PORTABILITY_REQUEST_CONFIRM_STARTED);
      expect(mockConfirmClaimPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockConfirmClaimPixKeyPspGateway).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should confirm EVP key already confirmed', async () => {
      const reason = ClaimReasonType.USER_REQUESTED;
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_REQUEST_CONFIRM_STARTED,
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
      expect(result.state).toBe(pixKey.state);
      expect(mockConfirmClaimPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not confirm an EVP key if state is incorrect', async () => {
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

      const testScript = () => usecase.execute(pixKey.id, reason);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockConfirmClaimPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not confirm EVP key with claim is null', async () => {
      mockConfirmClaimPixKeyPspGateway.mockImplementation(
        confirmPixKeyPspGatewayMock.success,
      );

      const reason = ClaimReasonType.USER_REQUESTED;

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_REQUEST_CONFIRM_OPENED,
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
      expect(mockConfirmClaimPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not confirm EVP key with claim invalid', async () => {
      mockConfirmClaimPixKeyPspGateway.mockImplementation(
        confirmPixKeyPspGatewayMock.success,
      );

      const reason = ClaimReasonType.USER_REQUESTED;

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_REQUEST_CONFIRM_OPENED,
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
      expect(mockConfirmClaimPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
