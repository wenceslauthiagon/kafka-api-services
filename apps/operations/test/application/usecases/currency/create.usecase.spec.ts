import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  CurrencyState,
  CurrencySymbolAlign,
  CurrencyType,
} from '@zro/operations/domain';
import { CreateCurrencyUseCase as UseCase } from '@zro/operations/application';
import {
  CurrencyDatabaseRepository,
  CurrencyModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { CurrencyFactory } from '@zro/test/operations/config';

describe('CreateCurrencyUseCase', () => {
  let module: TestingModule;
  const currencyRepository = new CurrencyDatabaseRepository();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get wallet if missing data', async () => {
      const usecase = new UseCase(logger, currencyRepository);

      const tests = [
        () => usecase.execute(null, null, null, null, null),
        () =>
          usecase.execute(faker.datatype.string(10), null, null, null, null),
        () =>
          usecase.execute(
            faker.datatype.string(10),
            faker.datatype.string(10),
            null,
            null,
            null,
          ),
        () =>
          usecase.execute(
            faker.datatype.string(10),
            faker.datatype.string(10),
            faker.datatype.string(10),
            faker.datatype.number({ min: 1, max: 8 }),
            null,
          ),
        () =>
          usecase.execute(
            null,
            faker.datatype.string(10),
            faker.datatype.string(10),
            faker.datatype.number({ min: 1, max: 8 }),
            CurrencyType.CRYPTO,
          ),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should create currency successfully', async () => {
      const title = faker.finance.currencyName();
      const symbol = faker.datatype.string(10);
      const tag = faker.random.alpha({ count: 5, casing: 'upper' });
      const decimal = faker.datatype.number({ min: 1, max: 8 });
      const type = CurrencyType.CRYPTO;

      const usecase = new UseCase(logger, currencyRepository);

      const result = await usecase.execute(title, symbol, tag, decimal, type);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(title);
      expect(result.symbol).toBe(symbol);
      expect(result.tag).toBe(tag);
      expect(result.decimal).toBe(decimal);
      expect(result.symbolAlign).toBe(CurrencySymbolAlign.LEFT);
      expect(result.state).toBe(CurrencyState.ACTIVE);
    });

    it('TC0003 - Should not create a existing currency', async () => {
      const currency = await CurrencyFactory.create<CurrencyModel>(
        CurrencyModel.name,
      );
      const { title, symbol, tag, decimal, type } = currency;

      const usecase = new UseCase(logger, currencyRepository);

      const result = await usecase.execute(title, symbol, tag, decimal, type);

      expect(result).toBeDefined();
      expect(result).toMatchObject(currency.toDomain());
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
