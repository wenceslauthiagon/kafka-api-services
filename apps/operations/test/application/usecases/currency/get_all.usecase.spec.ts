import { Test, TestingModule } from '@nestjs/testing';
import {
  MissingDataException,
  PaginationEntity,
  defaultLogger as logger,
} from '@zro/common';
import { CurrencyState, TGetCurrencyFilter } from '@zro/operations/domain';
import { GetAllCurrencyUseCase as UseCase } from '@zro/operations/application';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import {
  CurrencyDatabaseRepository,
  CurrencyModel,
} from '@zro/operations/infrastructure';
import { CurrencyFactory } from '@zro/test/operations/config';

describe('GetAllCurrencyUseCase', () => {
  let module: TestingModule;
  const currencyRepository = new CurrencyDatabaseRepository();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  describe('With invalid parameters', () => {
    it('TC0001 - Should not be able to get currencies without wrong pagination params', async () => {
      const filter: TGetCurrencyFilter = {};
      const pagination = new PaginationEntity();

      const sut = new UseCase(logger, currencyRepository);

      const tests = [
        () => sut.execute(null, null),
        () => sut.execute(null, filter),
        () => sut.execute(pagination, null),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should be able to get currencies by filter successfully', async () => {
      await CurrencyFactory.createMany<CurrencyModel>(CurrencyModel.name, 3, {
        state: CurrencyState.ACTIVE,
      });

      await CurrencyFactory.createMany<CurrencyModel>(CurrencyModel.name, 2, {
        state: CurrencyState.DEACTIVATE,
      });

      const pagination = new PaginationEntity();

      const filter: TGetCurrencyFilter = {
        state: CurrencyState.ACTIVE,
      };

      const usecase = new UseCase(logger, currencyRepository);

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
        expect(res.title).toBeDefined();
        expect(res.symbol).toBeDefined();
        expect(res.symbolAlign).toBeDefined();
        expect(res.tag).toBeDefined();
        expect(res.decimal).toBeDefined();
        expect(res.state).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
