import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { PixKeyEntity } from '@zro/pix-keys/domain';
import {
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import {
  HandleCanceledPixKeyQrCodeStaticEventUseCase as UseCase,
  QrCodeStaticEventEmitter,
} from '@zro/pix-payments/application';
import {
  QrCodeStaticDatabaseRepository,
  QrCodeStaticModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { QrCodeStaticFactory } from '@zro/test/pix-payments/config';

describe('HandleCanceledPixKeyQrCodeStaticEventUseCase', () => {
  let module: TestingModule;
  let qrCodeStaticRepository: QrCodeStaticRepository;

  const eventEmitter: QrCodeStaticEventEmitter =
    createMock<QrCodeStaticEventEmitter>();
  const mockDeletingEventEmitter: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.deletingQrCodeStatic),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    qrCodeStaticRepository = new QrCodeStaticDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - should delete qrCodeStatic successfully', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const pixKey = new PixKeyEntity({ id: faker.datatype.uuid(), user });
      await QrCodeStaticFactory.create<QrCodeStaticModel>(
        QrCodeStaticModel.name,
        {
          state: QrCodeStaticState.READY,
          userId: user.uuid,
          keyId: pixKey.id,
        },
      );

      const usecase = new UseCase(logger, qrCodeStaticRepository, eventEmitter);

      const result = await usecase.execute(user, pixKey);

      expect(result).toBeDefined();
      result.forEach((res) => {
        expect(res.id).toBeDefined();
        expect(res.state).toBe(QrCodeStaticState.DELETING);
      });
      expect(mockDeletingEventEmitter).toHaveBeenCalledTimes(result.length);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - should not delete with state deleting', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const pixKey = new PixKeyEntity({ id: faker.datatype.uuid(), user });
      await QrCodeStaticFactory.create<QrCodeStaticModel>(
        QrCodeStaticModel.name,
        {
          state: QrCodeStaticState.DELETING,
          userId: user.uuid,
          keyId: pixKey.id,
        },
      );

      const usecase = new UseCase(logger, qrCodeStaticRepository, eventEmitter);

      const result = await usecase.execute(user, pixKey);

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
      expect(mockDeletingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not delete if pixKey is not found', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const pixKey = new PixKeyEntity({ id: faker.datatype.uuid(), user });

      const usecase = new UseCase(logger, qrCodeStaticRepository, eventEmitter);

      const result = await usecase.execute(user, pixKey);

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
      expect(mockDeletingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not delete if pixKey is null', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      const usecase = new UseCase(logger, qrCodeStaticRepository, eventEmitter);

      const testScript = () => usecase.execute(user, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockDeletingEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
