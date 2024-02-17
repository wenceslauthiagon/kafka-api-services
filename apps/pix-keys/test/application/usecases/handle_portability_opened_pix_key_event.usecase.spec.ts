import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { KeyState, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  HandlePortabilityOpenedPixKeyEventUseCase as UseCase,
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
import * as mocks from '@zro/test/pix-keys/config/mocks/create_portability_claim_pix_key.mock';

describe('HandlePortabilityPixKeyEventUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;

  const pixKeyEventService: PixKeyEventEmitter =
    createMock<PixKeyEventEmitter>();
  const mockPortabilityStartedPixKeyEvent: jest.Mock = On(
    pixKeyEventService,
  ).get(method((mock) => mock.portabilityStartedPixKey));
  const pspGateway: PixKeyGateway = createMock<PixKeyGateway>();
  const mockCreatePortabilityClaimPixKeyPspGateway: jest.Mock = On(
    pspGateway,
  ).get(method((mock) => mock.createPortabilityClaim));
  const ispb = faker.datatype.number(99999).toString().padStart(8, '0');

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should start portability process successfully', async () => {
      mockCreatePortabilityClaimPixKeyPspGateway.mockImplementation(
        mocks.success,
      );

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_OPENED,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        pspGateway,
        ispb,
      );

      const result = await usecase.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.PORTABILITY_STARTED);
      expect(mockPortabilityStartedPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockCreatePortabilityClaimPixKeyPspGateway).toHaveBeenCalledTimes(
        1,
      );
    });

    it('TC0002 - Should do not do anything when state is portability started', async () => {
      mockCreatePortabilityClaimPixKeyPspGateway.mockImplementation(
        mocks.success,
      );

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_STARTED,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        pspGateway,
        ispb,
      );

      const result = await usecase.execute(pixKey.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.key).toBe(pixKey.key);
      expect(result.state).toBe(KeyState.PORTABILITY_STARTED);
      expect(mockPortabilityStartedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCreatePortabilityClaimPixKeyPspGateway).toHaveBeenCalledTimes(
        0,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not start portability process when state is not portability opened', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.READY,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyEventService,
        pspGateway,
        ispb,
      );

      const testScript = () => usecase.execute(pixKey.id);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockPortabilityStartedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockCreatePortabilityClaimPixKeyPspGateway).toHaveBeenCalledTimes(
        0,
      );
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
