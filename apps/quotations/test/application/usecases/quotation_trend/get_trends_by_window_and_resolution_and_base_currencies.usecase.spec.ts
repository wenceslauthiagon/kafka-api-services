import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  defaultLogger as logger,
  formatValueFromFloatToInt,
  MissingDataException,
} from '@zro/common';
import { OrderSide } from '@zro/otc/domain';
import { CurrencyEntity, CurrencyState } from '@zro/operations/domain';
import {
  QuotationTrendEntity,
  QuotationTrendRepository,
  QuotationTrendResolution,
  QuotationTrendWindow,
  StreamPairEntity,
  StreamPairRepository,
} from '@zro/quotations/domain';
import {
  GetTrendsByWindowAndResolutionAndBaseAndQuoteCurrenciesUseCase as UseCase,
  OperationService,
  QuotationTrendResolutionUnderMinResolutionException,
} from '@zro/quotations/application';
import { CurrencyNotFoundException } from '@zro/operations/application';
import { CurrencyFactory } from '@zro/test/operations/config';
import {
  QuotationTrendFactory,
  StreamPairFactory,
} from '@zro/test/quotations/config';

describe('GetTrendsByWindowAndResolutionAndBaseAndQuoteCurrenciesUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const quotationTrendRepository: QuotationTrendRepository =
      createMock<QuotationTrendRepository>();
    const mockGetTrends: jest.Mock = On(quotationTrendRepository).get(
      method(
        (mock) =>
          mock.getAvgByWindowAndResolutionAndAmountAndBaseAndQuoteCurrency,
      ),
    );

    const streamPairRepository: StreamPairRepository =
      createMock<StreamPairRepository>();
    const mockGetAllStreamPair: jest.Mock = On(streamPairRepository).get(
      method((mock) => mock.getAllByBaseAndQuoteCurrencyAndActiveIsTrue),
    );

    return {
      quotationTrendRepository,
      streamPairRepository,
      mockGetTrends,
      mockGetAllStreamPair,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockGetCurrencyOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.getCurrencyBySymbol),
    );

    return {
      operationService,
      mockGetCurrencyOperationService,
    };
  };

  const makeSut = () => {
    const {
      quotationTrendRepository,
      streamPairRepository,
      mockGetTrends,
      mockGetAllStreamPair,
    } = mockRepository();
    const quoteCurrency = new CurrencyEntity({
      symbol: 'BRL',
      decimal: 2,
      state: CurrencyState.ACTIVE,
    });

    const { operationService, mockGetCurrencyOperationService } = mockService();

    const sut = new UseCase(
      logger,
      quotationTrendRepository,
      streamPairRepository,
      operationService,
    );

    return {
      sut,
      quoteCurrency,
      mockGetTrends,
      mockGetAllStreamPair,
      mockGetCurrencyOperationService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get trendDay without params', async () => {
      const {
        sut,
        mockGetTrends,
        mockGetAllStreamPair,
        mockGetCurrencyOperationService,
      } = makeSut();

      const testScript = () => sut.execute(null, null, null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetAllStreamPair).toHaveBeenCalledTimes(0);
      expect(mockGetTrends).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not get without baseCurrencies', async () => {
      const {
        sut,
        quoteCurrency,
        mockGetTrends,
        mockGetAllStreamPair,
        mockGetCurrencyOperationService,
      } = makeSut();

      const testScript = () =>
        sut.execute(
          QuotationTrendWindow['QTW_12h'],
          QuotationTrendResolution['QTR_1h'],
          [],
          quoteCurrency,
        );

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetAllStreamPair).toHaveBeenCalledTimes(0);
      expect(mockGetTrends).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not get with invalid resolution by window', async () => {
      const {
        sut,
        quoteCurrency,
        mockGetTrends,
        mockGetAllStreamPair,
        mockGetCurrencyOperationService,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const testScript = () =>
        sut.execute(
          QuotationTrendWindow['QTW_1y'],
          QuotationTrendResolution['QTR_1m'],
          [baseCurrency],
          quoteCurrency,
        );

      await expect(testScript).rejects.toThrow(
        QuotationTrendResolutionUnderMinResolutionException,
      );

      expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetAllStreamPair).toHaveBeenCalledTimes(0);
      expect(mockGetTrends).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not get with inactive baseCurrencies', async () => {
      const {
        sut,
        quoteCurrency,
        mockGetTrends,
        mockGetAllStreamPair,
        mockGetCurrencyOperationService,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { state: CurrencyState.DEACTIVATE },
      );
      mockGetCurrencyOperationService.mockResolvedValue(baseCurrency);

      const result = await sut.execute(
        QuotationTrendWindow['QTW_1d'],
        QuotationTrendResolution['QTR_12h'],
        [baseCurrency],
        quoteCurrency,
      );

      expect(result).toBeDefined();
      expect(result.length).toBe(0);
      expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetAllStreamPair).toHaveBeenCalledTimes(0);
      expect(mockGetTrends).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not get with inactive quoteCurrency', async () => {
      const {
        sut,
        quoteCurrency,
        mockGetTrends,
        mockGetAllStreamPair,
        mockGetCurrencyOperationService,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      mockGetCurrencyOperationService
        .mockResolvedValueOnce(baseCurrency)
        .mockResolvedValueOnce(null);

      const testScript = () =>
        sut.execute(
          QuotationTrendWindow['QTW_1d'],
          QuotationTrendResolution['QTR_12h'],
          [baseCurrency],
          quoteCurrency,
        );

      await expect(testScript).rejects.toThrow(CurrencyNotFoundException);

      expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(2);
      expect(mockGetAllStreamPair).toHaveBeenCalledTimes(0);
      expect(mockGetTrends).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not get with inactive streamPairs', async () => {
      const {
        sut,
        quoteCurrency,
        mockGetTrends,
        mockGetAllStreamPair,
        mockGetCurrencyOperationService,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      mockGetCurrencyOperationService
        .mockResolvedValueOnce(baseCurrency)
        .mockResolvedValueOnce(quoteCurrency);
      mockGetAllStreamPair.mockResolvedValue([]);

      const result = await sut.execute(
        QuotationTrendWindow['QTW_1d'],
        QuotationTrendResolution['QTR_12h'],
        [baseCurrency],
        quoteCurrency,
      );

      expect(result).toBeDefined();
      expect(result.length).toBe(0);
      expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(2);
      expect(mockGetAllStreamPair).toHaveBeenCalledTimes(1);
      expect(mockGetTrends).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not get without trends found', async () => {
      const {
        sut,
        quoteCurrency,
        mockGetTrends,
        mockGetAllStreamPair,
        mockGetCurrencyOperationService,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      mockGetCurrencyOperationService
        .mockResolvedValueOnce(baseCurrency)
        .mockResolvedValueOnce(quoteCurrency);

      const streamPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      );
      mockGetAllStreamPair.mockResolvedValue([streamPair]);
      mockGetTrends.mockResolvedValue([]);

      const result = await sut.execute(
        QuotationTrendWindow['QTW_1d'],
        QuotationTrendResolution['QTR_12h'],
        [baseCurrency],
        quoteCurrency,
      );

      expect(result).toBeDefined();
      expect(result.length).toBe(0);
      expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(2);
      expect(mockGetAllStreamPair).toHaveBeenCalledTimes(1);
      expect(mockGetTrends).toHaveBeenCalledTimes(1);
    });

    it('TC0008 - Should not get without active trends', async () => {
      const {
        sut,
        quoteCurrency,
        mockGetTrends,
        mockGetAllStreamPair,
        mockGetCurrencyOperationService,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      mockGetCurrencyOperationService
        .mockResolvedValueOnce(baseCurrency)
        .mockResolvedValueOnce(quoteCurrency);

      const streamPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      );
      mockGetAllStreamPair.mockResolvedValue([streamPair]);

      const quotationTrend =
        await QuotationTrendFactory.create<QuotationTrendEntity>(
          QuotationTrendEntity.name,
        );
      mockGetTrends.mockResolvedValue([quotationTrend]);

      const result = await sut.execute(
        QuotationTrendWindow['QTW_1d'],
        QuotationTrendResolution['QTR_12h'],
        [baseCurrency],
        quoteCurrency,
      );

      expect(result).toBeDefined();
      expect(result.length).toBe(0);
      expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(2);
      expect(mockGetAllStreamPair).toHaveBeenCalledTimes(1);
      expect(mockGetTrends).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0009 - Should get just trend buy successfully', async () => {
      const {
        sut,
        mockGetTrends,
        mockGetAllStreamPair,
        mockGetCurrencyOperationService,
      } = makeSut();

      const streamPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      );
      mockGetAllStreamPair.mockResolvedValue([streamPair]);

      const quotationTrendBuy =
        await QuotationTrendFactory.create<QuotationTrendEntity>(
          QuotationTrendEntity.name,
          {
            side: OrderSide.BUY,
            gatewayName: streamPair.gatewayName,
          },
        );

      mockGetCurrencyOperationService
        .mockResolvedValueOnce(quotationTrendBuy.baseCurrency)
        .mockResolvedValueOnce(quotationTrendBuy.quoteCurrency);
      mockGetTrends.mockResolvedValue([quotationTrendBuy]);

      const result = await sut.execute(
        QuotationTrendWindow['QTW_1d'],
        QuotationTrendResolution['QTR_12h'],
        [quotationTrendBuy.baseCurrency],
        quotationTrendBuy.quoteCurrency,
      );

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].baseCurrency).toMatchObject(
        quotationTrendBuy.baseCurrency,
      );
      expect(result[0].quoteCurrency).toMatchObject(
        quotationTrendBuy.quoteCurrency,
      );
      expect(result[0].points).toBeDefined();
      expect(result[0].points.length).toBe(1);
      expect(result[0].points[0].buy).toBe(
        formatValueFromFloatToInt(
          quotationTrendBuy.price,
          quotationTrendBuy.quoteCurrency.decimal,
        ),
      );
      expect(result[0].points[0].sell).toBeNull();
      expect(result[0].points[0].price).toBeNull();
      expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(2);
      expect(mockGetAllStreamPair).toHaveBeenCalledTimes(1);
      expect(mockGetTrends).toHaveBeenCalledTimes(1);
    });

    it('TC0010 - Should get trends successfully', async () => {
      const {
        sut,
        quoteCurrency,
        mockGetTrends,
        mockGetAllStreamPair,
        mockGetCurrencyOperationService,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      mockGetCurrencyOperationService
        .mockResolvedValueOnce(baseCurrency)
        .mockResolvedValueOnce(quoteCurrency);

      const streamPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      );
      mockGetAllStreamPair.mockResolvedValue([streamPair]);

      const quotationTrendBuy =
        await QuotationTrendFactory.create<QuotationTrendEntity>(
          QuotationTrendEntity.name,
          {
            side: OrderSide.BUY,
            gatewayName: streamPair.gatewayName,
            baseCurrency,
            quoteCurrency,
          },
        );
      const quotationTrendSell =
        await QuotationTrendFactory.create<QuotationTrendEntity>(
          QuotationTrendEntity.name,
          {
            side: OrderSide.SELL,
            timestamp: quotationTrendBuy.timestamp,
            gatewayName: streamPair.gatewayName,
            baseCurrency,
            quoteCurrency,
          },
        );
      mockGetTrends.mockResolvedValue([quotationTrendBuy, quotationTrendSell]);

      const result = await sut.execute(
        QuotationTrendWindow['QTW_1d'],
        QuotationTrendResolution['QTR_12h'],
        [baseCurrency],
        quoteCurrency,
      );

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].baseCurrency).toMatchObject(baseCurrency);
      expect(result[0].quoteCurrency).toMatchObject(quoteCurrency);
      expect(result[0].points).toBeDefined();
      expect(result[0].points.length).toBe(1);
      expect(result[0].points[0].buy).toBe(
        formatValueFromFloatToInt(
          quotationTrendBuy.price,
          quoteCurrency.decimal,
        ),
      );
      expect(result[0].points[0].sell).toBe(
        formatValueFromFloatToInt(
          quotationTrendSell.price,
          quoteCurrency.decimal,
        ),
      );
      expect(result[0].points[0].price).toBe(
        formatValueFromFloatToInt(
          (quotationTrendBuy.price + quotationTrendSell.price) / 2,
          quoteCurrency.decimal,
        ),
      );
      expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(2);
      expect(mockGetAllStreamPair).toHaveBeenCalledTimes(1);
      expect(mockGetTrends).toHaveBeenCalledTimes(1);
    });
  });
});
