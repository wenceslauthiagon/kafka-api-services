import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  GetCurrencyBySymbolUseCase as UseCase,
  CurrencyNotFoundException,
} from '@zro/operations/application';
import {
  CurrencyDatabaseRepository,
  CurrencyModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { CurrencyFactory } from '@zro/test/operations/config';

describe('GetCurrencyBySymbolUseCase', () => {
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
    it('TC0002 - Should get currency by symbol successfully', async () => {
      const currency = await CurrencyFactory.create<CurrencyModel>(
        CurrencyModel.name,
      );

      const usecase = new UseCase(logger, currencyRepository);

      const result = await usecase.execute(currency.symbol);

      expect(result).toBeDefined();
      expect(result.symbol).toBe(currency.symbol);
    });

    it('TC0003 - Should not get currency with incorrect symbol', async () => {
      const symbol = uuidV4();

      const usecase = new UseCase(logger, currencyRepository);

      const testScript = () => usecase.execute(symbol);

      await expect(testScript).rejects.toThrow(CurrencyNotFoundException);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
