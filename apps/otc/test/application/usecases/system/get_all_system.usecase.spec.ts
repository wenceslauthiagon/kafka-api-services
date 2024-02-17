import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, PaginationEntity } from '@zro/common';
import { SystemRepository } from '@zro/otc/domain';
import { GetAllSystemUseCase as UseCase } from '@zro/otc/application';
import { SystemDatabaseRepository, SystemModel } from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { SystemFactory } from '@zro/test/otc/config';

describe('GetAllSystemUseCase', () => {
  let module: TestingModule;
  let systemRepository: SystemRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    systemRepository = new SystemDatabaseRepository();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get system successfully', async () => {
      await SystemFactory.createMany<SystemModel>(SystemModel.name, 5);

      const usecase = new UseCase(logger, systemRepository);

      const pagination = new PaginationEntity();

      const result = await usecase.execute(pagination);

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
        expect(res.createdAt).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
