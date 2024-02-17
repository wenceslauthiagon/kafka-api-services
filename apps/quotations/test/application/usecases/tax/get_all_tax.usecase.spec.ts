import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { PaginationEntity, PaginationOrder } from '@zro/common';
import { GetTaxFilter, TaxRepository } from '@zro/quotations/domain';
import { GetAllTaxUseCase as UseCase } from '@zro/quotations/application';
import {
  TaxDatabaseRepository,
  TaxModel,
} from '@zro/quotations/infrastructure';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import { TaxFactory } from '@zro/test/quotations/config';

describe('GetAllTaxUseCase', () => {
  let module: TestingModule;
  let taxRepository: TaxRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    taxRepository = new TaxDatabaseRepository();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get tax successfully', async () => {
      await TaxFactory.createMany<TaxModel>(TaxModel.name, 3);

      const usecase = new UseCase(logger, taxRepository);

      const pagination = new PaginationEntity({
        pageSize: 3,
        sort: 'created_at',
        order: PaginationOrder.DESC,
      });
      const filter = {};

      const result = await usecase.execute(pagination, filter);

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
        expect(res.format.indexOf('[VALUE]')).toBeGreaterThan(-1);
        expect(res.formattedValue).toBeDefined();
      });
    });

    it('TC0002 - Should get tax successfully with certain search term', async () => {
      const searchName = 'iof';

      await TaxFactory.createMany<TaxModel>(TaxModel.name, 3, {
        name: searchName,
      });

      await TaxFactory.createMany<TaxModel>(TaxModel.name, 2);

      const usecase = new UseCase(logger, taxRepository);

      const pagination = new PaginationEntity({
        pageSize: 3,
        sort: 'created_at',
        order: PaginationOrder.DESC,
      });

      const filter: GetTaxFilter = {
        name: searchName,
      };

      const result = await usecase.execute(pagination, filter);

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
        expect(res.format.indexOf('[VALUE]')).toBeGreaterThan(-1);
        expect(res.formattedValue).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
