import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MissingDataException,
  defaultLogger as logger,
  ForbiddenException,
} from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { QrCodeStaticRepository } from '@zro/pix-payments/domain';
import {
  GetByQrCodeStaticIdUseCase as UseCase,
  QrCodeStaticNotFoundException,
} from '@zro/pix-payments/application';
import {
  QrCodeStaticDatabaseRepository,
  QrCodeStaticModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { QrCodeStaticFactory } from '@zro/test/pix-payments/config';

describe('GetByQrCodeStaticIdUseCase', () => {
  let module: TestingModule;
  let qrCodeStaticRepository: QrCodeStaticRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    qrCodeStaticRepository = new QrCodeStaticDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - should get qrCodeStatic successfully', async () => {
      const qrCodeStatic = await QrCodeStaticFactory.create<QrCodeStaticModel>(
        QrCodeStaticModel.name,
      );
      const user = new UserEntity({ uuid: qrCodeStatic.userId });
      const usecase = new UseCase(logger, qrCodeStaticRepository);

      const result = await usecase.execute(user, qrCodeStatic.id);

      expect(result).toMatchObject(qrCodeStatic.toDomain());
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get the qrCodeStatic if another user has this qrCodeStatic id', async () => {
      const qrCodeStatic = await QrCodeStaticFactory.create<QrCodeStaticModel>(
        QrCodeStaticModel.name,
      );
      const usecase = new UseCase(logger, qrCodeStaticRepository);

      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      const testScript = () => usecase.execute(user, qrCodeStatic.id);

      await expect(testScript).rejects.toThrow(ForbiddenException);
    });

    it('TC0003 - Should not delete if qrCodeStatic is not found', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      const usecase = new UseCase(logger, qrCodeStaticRepository);

      const id = faker.datatype.uuid();
      const testScript = () => usecase.execute(user, id);

      await expect(testScript).rejects.toThrow(QrCodeStaticNotFoundException);
    });

    it('TC0004 - Should not get if id is null', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      const usecase = new UseCase(logger, qrCodeStaticRepository);

      const testScript = () => usecase.execute(user, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
