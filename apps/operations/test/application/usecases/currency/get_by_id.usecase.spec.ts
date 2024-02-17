import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { GetCurrencyByIdUseCase as UseCase } from '@zro/operations/application';
import {
  CurrencyDatabaseRepository,
  CurrencyModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { CurrencyFactory } from '@zro/test/operations/config';

describe('GetCurrencyByIdUseCase', () => {
  let module: TestingModule;
  const currencyRepository = new CurrencyDatabaseRepository();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get currency if missing data', async () => {
      const usecase = new UseCase(logger, currencyRepository);

      await expect(() => usecase.execute(null)).rejects.toThrow(
        MissingDataException,
      );
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get currency by id successfully', async () => {
      const currency = await CurrencyFactory.create<CurrencyModel>(
        CurrencyModel.name,
      );

      const usecase = new UseCase(logger, currencyRepository);

      const result = await usecase.execute(currency.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(currency.id);
    });

    it('TC0003 - Should not get currency with incorrect id', async () => {
      const id = faker.datatype.number({ min: 9999, max: 999999999 });

      const usecase = new UseCase(logger, currencyRepository);

      const result = await usecase.execute(id);

      expect(result).toBeNull();
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
