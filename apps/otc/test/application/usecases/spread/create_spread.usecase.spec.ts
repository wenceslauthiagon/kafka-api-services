import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger, MissingDataException } from '@zro/common';
import { CurrencyEntity } from '@zro/operations/domain';
import { SpreadRepository } from '@zro/otc/domain';
import {
  CreateSpreadUseCase as UseCase,
  OperationService,
  SpreadEventEmitter,
} from '@zro/otc/application';
import { CurrencyFactory } from '@zro/test/operations/config';

describe('CreateSpreadUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const eventEmitter: SpreadEventEmitter = createMock<SpreadEventEmitter>();
  const mockCreatedEventEmitter: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.createdSpreads),
  );

  const operationService: OperationService = createMock<OperationService>();
  const mockGetCurrencyOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyBySymbol),
  );
  const mockCreateCurrencyOperationService: jest.Mock = On(
    operationService,
  ).get(method((mock) => mock.createCurrency));

  const spreadRepository: SpreadRepository = createMock<SpreadRepository>();
  const mockDeleteByFilterSpreadRepository: jest.Mock = On(
    spreadRepository,
  ).get(method((mock) => mock.deleteByCurrency));
  const mockCreateSpreadRepository: jest.Mock = On(spreadRepository).get(
    method((mock) => mock.create),
  );

  describe('With valid parameters', () => {
    it('TC0001 - should create a spread', async () => {
      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const base = new CurrencyEntity({ symbol: currency.symbol });
      const items = [
        {
          buy: faker.datatype.float(2),
          sell: faker.datatype.float(2),
          amount: faker.datatype.float(2),
        },
      ];

      const usecase = new UseCase(
        defaultLogger,
        spreadRepository,
        operationService,
        eventEmitter,
      );

      mockGetCurrencyOperationService.mockResolvedValue(null);
      mockCreateCurrencyOperationService.mockResolvedValue(currency);
      mockDeleteByFilterSpreadRepository.mockResolvedValue(items.length);
      mockCreateSpreadRepository.mockImplementation((spread) => ({
        ...spread,
        createdAt: new Date(),
      }));

      const result = await usecase.execute(base, items);

      expect(result).toBeDefined();
      result.forEach((res) => {
        expect(res.id).toBeDefined();
        expect(res.createdAt).toBeDefined();
      });
      expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(1);
      expect(mockCreateCurrencyOperationService).toHaveBeenCalledTimes(1);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockDeleteByFilterSpreadRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateSpreadRepository).toHaveBeenCalledTimes(items.length);
      expect(mockCreatedEventEmitter.mock.calls[0][0]).toHaveLength(
        items.length,
      );
    });

    it('TC0002 - should create many spreads', async () => {
      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const usecase = new UseCase(
        defaultLogger,
        spreadRepository,
        operationService,
        eventEmitter,
      );

      const base = new CurrencyEntity({ symbol: currency.symbol });
      const items = [
        {
          buy: faker.datatype.float(2),
          sell: faker.datatype.float(2),
          amount: faker.datatype.float(2),
        },
        {
          buy: faker.datatype.float(2),
          sell: faker.datatype.float(2),
          amount: faker.datatype.float(2),
        },
      ];

      mockGetCurrencyOperationService.mockResolvedValue(null);
      mockCreateCurrencyOperationService.mockResolvedValue(currency);
      mockDeleteByFilterSpreadRepository.mockResolvedValue(items.length);
      mockCreateSpreadRepository.mockImplementation((spread) => ({
        ...spread,
        createdAt: new Date(),
      }));

      const result = await usecase.execute(base, items);

      expect(result).toBeDefined();
      result.forEach((res) => {
        expect(res.id).toBeDefined();
        expect(res.createdAt).toBeDefined();
      });
      expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(1);
      expect(mockCreateCurrencyOperationService).toHaveBeenCalledTimes(1);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockDeleteByFilterSpreadRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateSpreadRepository).toHaveBeenCalledTimes(items.length);
      expect(mockCreatedEventEmitter.mock.calls[0][0]).toHaveLength(
        items.length,
      );
    });

    it('TC0003 - should delete the old spreads', async () => {
      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const usecase = new UseCase(
        defaultLogger,
        spreadRepository,
        operationService,
        eventEmitter,
      );

      const base = new CurrencyEntity({ symbol: currency.symbol });
      const items = [];

      mockGetCurrencyOperationService.mockResolvedValue(null);
      mockCreateCurrencyOperationService.mockResolvedValue(currency);
      mockDeleteByFilterSpreadRepository.mockResolvedValue(items.length);
      mockCreateSpreadRepository.mockImplementation((spread) => ({
        ...spread,
        createdAt: new Date(),
      }));

      const result = await usecase.execute(base, items);

      expect(result).toBeDefined();
      expect(result).toHaveLength(items.length);
      expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(1);
      expect(mockCreateCurrencyOperationService).toHaveBeenCalledTimes(1);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockDeleteByFilterSpreadRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateSpreadRepository).toHaveBeenCalledTimes(items.length);
      expect(mockCreatedEventEmitter.mock.calls[0][0]).toHaveLength(
        items.length,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0004 - With invalid currency', async () => {
      const usecase = new UseCase(
        defaultLogger,
        spreadRepository,
        operationService,
        eventEmitter,
      );

      const items = [];

      const testScript = () => usecase.execute(null, items);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(0);
      expect(mockCreateCurrencyOperationService).toHaveBeenCalledTimes(0);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockDeleteByFilterSpreadRepository).toHaveBeenCalledTimes(0);
    });
  });
});
