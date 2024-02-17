import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MissingDataException,
  defaultLogger as logger,
  ForbiddenException,
} from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import {
  DeleteByQrCodeStaticIdUseCase as UseCase,
  QrCodeStaticEventEmitter,
  QrCodeStaticNotFoundException,
} from '@zro/pix-payments/application';
import {
  QrCodeStaticDatabaseRepository,
  QrCodeStaticModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { QrCodeStaticFactory } from '@zro/test/pix-payments/config';

describe('DeleteByQrCodeStaticIdUseCase', () => {
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
      const qrCodeStatic = await QrCodeStaticFactory.create<QrCodeStaticModel>(
        QrCodeStaticModel.name,
        { state: QrCodeStaticState.READY },
      );
      const user = new UserEntity({ uuid: qrCodeStatic.userId });
      const usecase = new UseCase(logger, qrCodeStaticRepository, eventEmitter);

      const result = await usecase.execute(user, qrCodeStatic.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(qrCodeStatic.id);
      expect(result.state).toBe(QrCodeStaticState.DELETING);
      expect(mockDeletingEventEmitter).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - should not delete with state deleting', async () => {
      const qrCodeStatic = await QrCodeStaticFactory.create<QrCodeStaticModel>(
        QrCodeStaticModel.name,
        { state: QrCodeStaticState.DELETING },
      );
      const user = new UserEntity({ uuid: qrCodeStatic.userId });
      const usecase = new UseCase(logger, qrCodeStaticRepository, eventEmitter);

      const result = await usecase.execute(user, qrCodeStatic.id);

      expect(result).toBeDefined();
      expect(result).toMatchObject(qrCodeStatic.toDomain());
      expect(mockDeletingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not delete the qrCodeStatic if another user has this qrCodeStatic id', async () => {
      const qrCodeStatic = await QrCodeStaticFactory.create<QrCodeStaticModel>(
        QrCodeStaticModel.name,
      );
      const usecase = new UseCase(logger, qrCodeStaticRepository, eventEmitter);

      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      const testScript = () => usecase.execute(user, qrCodeStatic.id);

      await expect(testScript).rejects.toThrow(ForbiddenException);
      expect(mockDeletingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not delete if qrCodeStatic is not found', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      const usecase = new UseCase(logger, qrCodeStaticRepository, eventEmitter);

      const id = faker.datatype.uuid();
      const testScript = () => usecase.execute(user, id);

      await expect(testScript).rejects.toThrow(QrCodeStaticNotFoundException);
      expect(mockDeletingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not delete if id is null', async () => {
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
