import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import {
  HandleDeletingFailedQrCodeStaticEventUseCase as UseCase,
  QrCodeStaticEventEmitter,
} from '@zro/pix-payments/application';
import {
  QrCodeStaticDatabaseRepository,
  QrCodeStaticModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { QrCodeStaticFactory } from '@zro/test/pix-payments/config';

describe('HandleDeletingFailedQrCodeStaticEventUseCase', () => {
  let module: TestingModule;
  let qrCodeStaticRepository: QrCodeStaticRepository;

  const eventEmitter: QrCodeStaticEventEmitter =
    createMock<QrCodeStaticEventEmitter>();
  const mockErrorEventEmitter: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.errorQrCodeStatic),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    qrCodeStaticRepository = new QrCodeStaticDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should handle failed QrCodeStatic successfully', async () => {
      const qrCodeStatic = await QrCodeStaticFactory.create<QrCodeStaticModel>(
        QrCodeStaticModel.name,
        { state: QrCodeStaticState.DELETING },
      );

      const usecase = new UseCase(logger, qrCodeStaticRepository, eventEmitter);
      const result = await usecase.execute(qrCodeStatic.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(qrCodeStatic.id);
      expect(result.pixKey.id).toBe(qrCodeStatic.keyId);
      expect(result.state).toBe(QrCodeStaticState.ERROR);
      expect(mockErrorEventEmitter).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not handle failed if incorrect state', async () => {
      const qrCodeStatic = await QrCodeStaticFactory.create<QrCodeStaticModel>(
        QrCodeStaticModel.name,
        { state: QrCodeStaticState.ERROR },
      );

      const usecase = new UseCase(logger, qrCodeStaticRepository, eventEmitter);
      const result = await usecase.execute(qrCodeStatic.id);

      expect(result).toBeDefined();
      expect(result).toMatchObject(qrCodeStatic.toDomain());
      expect(mockErrorEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create if id is null', async () => {
      const usecase = new UseCase(logger, qrCodeStaticRepository, eventEmitter);

      const testScript = () => usecase.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockErrorEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create if id is not found', async () => {
      const usecase = new UseCase(logger, qrCodeStaticRepository, eventEmitter);

      const result = await usecase.execute(uuidV4());

      expect(result).toBeNull();
      expect(mockErrorEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
