import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  ClaimReasonType,
  KeyState,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  HandlePortabilityCancelingPixKeyEventUseCase as UseCase,
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
import * as cancelPixKeyPspGatewayMock from '@zro/test/pix-keys/config/mocks/cancel_portability_claim_pix_key.mock';

describe('HandlePortabilityCancelingPixKeyEventUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;

  const reason = ClaimReasonType.USER_REQUESTED;
  const ZRO_ISPB = '26264220';

  const pixKeyEventService: PixKeyEventEmitter =
    createMock<PixKeyEventEmitter>();
  const mockPortabilityCanceledPixKeyEvent: jest.Mock = On(
    pixKeyEventService,
  ).get(method((mock) => mock.portabilityCanceledPixKey));
  const pspGateway: PixKeyGateway = createMock<PixKeyGateway>();
  const mockCancelClaimPixKeyPspGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.cancelPortabilityClaim),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should cancel EVP key successfully', async () => {
      mockCancelClaimPixKeyPspGateway.mockImplementation(
        cancelPixKeyPspGatewayMock.success,
      );

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_CANCELING,
        claimId: uuidV4(),
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        pspGateway,
        ZRO_ISPB,
      );

      const result = await usecase.execute(pixKey.id, reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.PORTABILITY_CANCELED);
      expect(mockPortabilityCanceledPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockCancelClaimPixKeyPspGateway).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should cancel EVP key already canceled', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_CANCELED,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        pspGateway,
        ZRO_ISPB,
      );

      const result = await usecase.execute(pixKey.id, reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(pixKey.state);
      expect(mockPortabilityCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCancelClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not cancel an EVP key if state is incorrect', async () => {
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

      const testScript = () => usecase.execute(pixKey.id, reason);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockPortabilityCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCancelClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not cancel a claim invalid', async () => {
      mockCancelClaimPixKeyPspGateway.mockImplementation(
        cancelPixKeyPspGatewayMock.success,
      );

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_CANCELING,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        pspGateway,
        ZRO_ISPB,
      );

      const testScript = () => usecase.execute(pixKey.id, reason);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockPortabilityCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCancelClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
