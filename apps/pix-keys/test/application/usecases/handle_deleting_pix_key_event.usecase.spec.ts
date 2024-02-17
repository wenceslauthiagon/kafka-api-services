import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import {
  PixKeyReasonType,
  KeyState,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  HandleDeletingPixKeyEventUseCase as UseCase,
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
import * as deletePixKeyPspGatewayMock from '@zro/test/pix-keys/config/mocks/delete_pix_key.mock';

describe('HandleDeletingPixKeyEventUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;
  const ZRO_ISPB = '26264220';

  const pixKeyEventService: PixKeyEventEmitter =
    createMock<PixKeyEventEmitter>();
  const mockDeletedPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.deletedPixKey),
  );
  const pspGateway: PixKeyGateway = createMock<PixKeyGateway>();
  const mockDeletePixKeyPspGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.deletePixKey),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should delete EVP key successfully', async () => {
      mockDeletePixKeyPspGateway.mockImplementation(
        deletePixKeyPspGatewayMock.success,
      );

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.DELETING,
        deletedByReason: PixKeyReasonType.USER_REQUESTED,
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
      expect(result.state).toBe(KeyState.DELETED);
      expect(result.deletedByReason).toBe(pixKey.deletedByReason);
      expect(result.deletedAt).toBeDefined();
      expect(mockDeletedPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockDeletePixKeyPspGateway).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not delete an EVP key if state is not deleting', async () => {
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
      expect(mockDeletedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockDeletePixKeyPspGateway).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
