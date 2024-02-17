import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, PaginationEntity } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { QrCodeStaticRepository } from '@zro/pix-payments/domain';
import { GetAllQrCodeStaticUseCase as UseCase } from '@zro/pix-payments/application';
import {
  QrCodeStaticDatabaseRepository,
  QrCodeStaticModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { QrCodeStaticFactory } from '@zro/test/pix-payments/config';

describe('GetAllQrCodeStaticUseCase', () => {
  let module: TestingModule;
  let qrCodeStaticRepository: QrCodeStaticRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    qrCodeStaticRepository = new QrCodeStaticDatabaseRepository();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get qrCodeStatic successfully', async () => {
      const userId = uuidV4();
      await QrCodeStaticFactory.createMany<QrCodeStaticModel>(
        QrCodeStaticModel.name,
        3,
        { userId },
      );

      const usecase = new UseCase(logger, qrCodeStaticRepository);

      const user = new UserEntity({ uuid: userId });
      const pagination = new PaginationEntity();

      const result = await usecase.execute(user, pagination);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.user.uuid).toBe(userId);
        expect(res.createdAt).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
