import { Test, TestingModule } from '@nestjs/testing';
import { PaginationEntity, defaultLogger as logger } from '@zro/common';
import { ProviderRepository } from '@zro/otc/domain';
import { GetAllProviderUseCase as UseCase } from '@zro/otc/application';
import {
  ProviderDatabaseRepository,
  ProviderModel,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ProviderFactory } from '@zro/test/otc/config';

describe('GetAllProviderUseCase', () => {
  let module: TestingModule;
  let providerRepository: ProviderRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    providerRepository = new ProviderDatabaseRepository();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get provider successfully', async () => {
      await ProviderFactory.createMany<ProviderModel>(ProviderModel.name, 5);

      const usecase = new UseCase(logger, providerRepository);

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
