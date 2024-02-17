import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { OrderSide, SpreadEntity } from '@zro/otc/domain';
import { UserEntity } from '@zro/users/domain';
import {
  HolidayRepository,
  QuotationRepository,
  StreamPairRepository,
  StreamQuotationEntity,
  StreamQuotationRepository,
  TaxRepository,
  TaxEntity,
} from '@zro/quotations/domain';
import { CurrencyEntity } from '@zro/operations/domain';
import {
  GetQuotationUseCase as UseCase,
  OtcService,
  QuotationAmountUnderMinAmountException,
  StreamQuotationNotFoundException,
  TaxNotFoundException,
} from '@zro/quotations/application';
import { SpreadNotFoundException } from '@zro/otc/application';
import { SpreadFactory } from '@zro/test/otc/config';
import {
  StreamQuotationFactory,
  TaxFactory,
} from '@zro/test/quotations/config';

describe('GetQuotationUseCase', () => {
  const operationCurrencySymbol = 'BRL';
  const otcTaxIofName = 'iof';

  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const streamPairRepository: StreamPairRepository =
      createMock<StreamPairRepository>();
    const mockGetAllActiveIsTrue: jest.Mock = On(streamPairRepository).get(
      method((mock) => mock.getAllActiveIsTrue),
    );
    const streamQuotationRepository: StreamQuotationRepository =
      createMock<StreamQuotationRepository>();
    const mockGetStreamQuotation: jest.Mock = On(streamQuotationRepository).get(
      method((mock) => mock.getByBaseCurrencyAndQuoteCurrencyAndName),
    );
    const quotationRepository: QuotationRepository =
      createMock<QuotationRepository>();
    const holidayRepository: HolidayRepository =
      createMock<HolidayRepository>();
    const mockGetHolidayByDate: jest.Mock = On(holidayRepository).get(
      method((mock) => mock.getByDate),
    );
    const taxRepository: TaxRepository = createMock<TaxRepository>();
    const mockGetTax: jest.Mock = On(taxRepository).get(
      method((mock) => mock.getByName),
    );

    return {
      quotationRepository,
      streamPairRepository,
      streamQuotationRepository,
      taxRepository,
      holidayRepository,
      mockGetStreamQuotation,
      mockGetAllActiveIsTrue,
      mockGetHolidayByDate,
      mockGetTax,
    };
  };

  const mockService = () => {
    const otcService: OtcService = createMock<OtcService>();
    const mockGetSpreadsByCurrencies: jest.Mock = On(otcService).get(
      method((mock) => mock.getSpreadsByUserAndCurrencies),
    );

    return {
      otcService,
      mockGetSpreadsByCurrencies,
    };
  };

  const makeSut = () => {
    const {
      streamPairRepository,
      streamQuotationRepository,
      quotationRepository,
      taxRepository,
      holidayRepository,
      mockGetStreamQuotation,
      mockGetAllActiveIsTrue,
      mockGetHolidayByDate,
      mockGetTax,
    } = mockRepository();

    const { otcService, mockGetSpreadsByCurrencies } = mockService();

    const sut = new UseCase(
      logger,
      streamPairRepository,
      streamQuotationRepository,
      quotationRepository,
      taxRepository,
      holidayRepository,
      otcService,
      operationCurrencySymbol,
      otcTaxIofName,
    );

    return {
      sut,
      mockGetSpreadsByCurrencies,
      mockGetAllActiveIsTrue,
      mockGetStreamQuotation,
      mockGetTax,
      mockGetHolidayByDate,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get quotation without params', async () => {
      const {
        sut,
        mockGetSpreadsByCurrencies,
        mockGetAllActiveIsTrue,
        mockGetStreamQuotation,
        mockGetTax,
        mockGetHolidayByDate,
      } = makeSut();

      const testScript = () => sut.execute(null, null, null, null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetAllActiveIsTrue).toHaveBeenCalledTimes(0);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetSpreadsByCurrencies).toHaveBeenCalledTimes(0);
      expect(mockGetTax).toHaveBeenCalledTimes(0);
      expect(mockGetHolidayByDate).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not get quotation without stream quotation', async () => {
      const {
        sut,
        mockGetSpreadsByCurrencies,
        mockGetAllActiveIsTrue,
        mockGetStreamQuotation,
        mockGetTax,
        mockGetHolidayByDate,
      } = makeSut();

      mockGetAllActiveIsTrue.mockResolvedValue([]);

      const user = new UserEntity({ uuid: uuidV4() });
      const baseCurrency = new CurrencyEntity({ symbol: 'ZZ' });
      const side = OrderSide.BUY;
      const amount = 100000;
      const amountCurrency = new CurrencyEntity({ symbol: 'ZZ' });

      const testScript = () =>
        sut.execute(user, amount, amountCurrency, baseCurrency, side);

      await expect(testScript).rejects.toThrow(
        StreamQuotationNotFoundException,
      );
      expect(mockGetAllActiveIsTrue).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetSpreadsByCurrencies).toHaveBeenCalledTimes(0);
      expect(mockGetTax).toHaveBeenCalledTimes(0);
      expect(mockGetHolidayByDate).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not get quotation without spread', async () => {
      const currencyBTC = new CurrencyEntity({ symbol: 'BTC', decimal: 8 });
      const currencyBRL = new CurrencyEntity({
        symbol: operationCurrencySymbol,
      });

      const {
        sut,
        mockGetSpreadsByCurrencies,
        mockGetAllActiveIsTrue,
        mockGetStreamQuotation,
        mockGetTax,
        mockGetHolidayByDate,
      } = makeSut();

      mockGetAllActiveIsTrue.mockResolvedValue([{}]);
      mockGetStreamQuotation.mockResolvedValue({});
      mockGetSpreadsByCurrencies.mockResolvedValue([]);
      mockGetHolidayByDate.mockResolvedValue(null);

      const user = new UserEntity({ uuid: uuidV4() });
      const baseCurrency = currencyBTC;
      const side = OrderSide.BUY;
      const amount = 100000;
      const amountCurrency = currencyBRL;

      const testScript = () =>
        sut.execute(user, amount, amountCurrency, baseCurrency, side);

      await expect(testScript).rejects.toThrow(SpreadNotFoundException);
      expect(mockGetAllActiveIsTrue).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
      expect(mockGetSpreadsByCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetTax).toHaveBeenCalledTimes(0);
      expect(mockGetHolidayByDate).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not get quotation without tax', async () => {
      const currencyBTC = new CurrencyEntity({ symbol: 'BTC', decimal: 8 });
      const currencyBRL = new CurrencyEntity({
        symbol: operationCurrencySymbol,
      });
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
        );

      const spread = await SpreadFactory.create<SpreadEntity>(
        SpreadEntity.name,
      );

      const {
        sut,
        mockGetSpreadsByCurrencies,
        mockGetAllActiveIsTrue,
        mockGetStreamQuotation,
        mockGetTax,
        mockGetHolidayByDate,
      } = makeSut();

      mockGetAllActiveIsTrue.mockResolvedValue([streamQuotation.streamPair]);
      mockGetStreamQuotation.mockResolvedValue(streamQuotation);
      mockGetSpreadsByCurrencies.mockResolvedValue([spread]);
      mockGetTax.mockResolvedValue(null);
      mockGetHolidayByDate.mockResolvedValue(null);

      const user = new UserEntity({ uuid: uuidV4() });
      const baseCurrency = currencyBTC;
      const side = OrderSide.BUY;
      const amount = 100000;
      const amountCurrency = currencyBRL;

      const testScript = () =>
        sut.execute(user, amount, amountCurrency, baseCurrency, side);

      await expect(testScript).rejects.toThrow(TaxNotFoundException);
      expect(mockGetAllActiveIsTrue).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
      expect(mockGetSpreadsByCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetTax).toHaveBeenCalledTimes(1);
      expect(mockGetHolidayByDate).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not get quotation with tax = 0', async () => {
      const currencyBTC = new CurrencyEntity({ symbol: 'BTC', decimal: 8 });
      const currencyBRL = new CurrencyEntity({
        symbol: operationCurrencySymbol,
      });
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          {
            buy: 100200.15,
            sell: 100200.15,
            composedBy: null,
            baseCurrency: currencyBTC,
            quoteCurrency: currencyBRL,
          },
        );
      const spread = await SpreadFactory.create<SpreadEntity>(
        SpreadEntity.name,
        { buy: 100, sell: 100 },
      );

      const {
        sut,
        mockGetSpreadsByCurrencies,
        mockGetAllActiveIsTrue,
        mockGetStreamQuotation,
        mockGetTax,
        mockGetHolidayByDate,
      } = makeSut();

      mockGetAllActiveIsTrue.mockResolvedValue([streamQuotation.streamPair]);
      mockGetStreamQuotation.mockResolvedValue(streamQuotation);
      mockGetSpreadsByCurrencies.mockResolvedValue([spread]);
      mockGetTax.mockResolvedValue(
        await TaxFactory.create<TaxEntity>(TaxEntity.name, { value: 38 }),
      );
      mockGetHolidayByDate.mockResolvedValue(null);

      const user = new UserEntity({ uuid: uuidV4() });
      const baseCurrency = currencyBTC;
      const side = OrderSide.BUY;
      const amount = 1;
      const amountCurrency = currencyBRL;

      const testScript = () =>
        sut.execute(user, amount, amountCurrency, baseCurrency, side);

      await expect(testScript).rejects.toThrow(
        QuotationAmountUnderMinAmountException,
      );
      expect(mockGetAllActiveIsTrue).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
      expect(mockGetSpreadsByCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetTax).toHaveBeenCalledTimes(1);
      expect(mockGetHolidayByDate).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should not get quotation with spread buy = 1', async () => {
      const currencyBTC = new CurrencyEntity({ symbol: 'BTC', decimal: 8 });
      const currencyBRL = new CurrencyEntity({
        symbol: operationCurrencySymbol,
      });
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          {
            buy: 100200.15,
            sell: 100200.15,
            composedBy: null,
            baseCurrency: currencyBTC,
            quoteCurrency: currencyBRL,
          },
        );
      const spread = await SpreadFactory.create<SpreadEntity>(
        SpreadEntity.name,
        { buy: 1, sell: 100 },
      );

      const {
        sut,
        mockGetSpreadsByCurrencies,
        mockGetAllActiveIsTrue,
        mockGetStreamQuotation,
        mockGetTax,
        mockGetHolidayByDate,
      } = makeSut();

      mockGetAllActiveIsTrue.mockResolvedValue([streamQuotation.streamPair]);
      mockGetStreamQuotation.mockResolvedValue(streamQuotation);
      mockGetSpreadsByCurrencies.mockResolvedValue([spread]);
      mockGetTax.mockResolvedValue(
        await TaxFactory.create<TaxEntity>(TaxEntity.name, { value: 38 }),
      );
      mockGetHolidayByDate.mockResolvedValue(null);

      const user = new UserEntity({ uuid: uuidV4() });
      const baseCurrency = currencyBTC;
      const side = OrderSide.BUY;
      const amount = 1;
      const amountCurrency = currencyBRL;

      const testScript = () =>
        sut.execute(user, amount, amountCurrency, baseCurrency, side);

      await expect(testScript).rejects.toThrow(
        QuotationAmountUnderMinAmountException,
      );
      expect(mockGetAllActiveIsTrue).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
      expect(mockGetSpreadsByCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetTax).toHaveBeenCalledTimes(1);
      expect(mockGetHolidayByDate).toHaveBeenCalledTimes(1);
    });

    it('TC0007 - Should not get quotation with spread sell = 1', async () => {
      const currencyBTC = new CurrencyEntity({ symbol: 'BTC', decimal: 8 });
      const currencyBRL = new CurrencyEntity({
        symbol: operationCurrencySymbol,
      });
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          {
            buy: 100200.15,
            sell: 100200.15,
            composedBy: null,
            baseCurrency: currencyBTC,
            quoteCurrency: currencyBRL,
          },
        );
      const spread = await SpreadFactory.create<SpreadEntity>(
        SpreadEntity.name,
        { buy: 100, sell: 1 },
      );

      const {
        sut,
        mockGetSpreadsByCurrencies,
        mockGetAllActiveIsTrue,
        mockGetStreamQuotation,
        mockGetTax,
        mockGetHolidayByDate,
      } = makeSut();

      mockGetAllActiveIsTrue.mockResolvedValue([streamQuotation.streamPair]);
      mockGetStreamQuotation.mockResolvedValue(streamQuotation);
      mockGetSpreadsByCurrencies.mockResolvedValue([spread]);
      mockGetTax.mockResolvedValue(
        await TaxFactory.create<TaxEntity>(TaxEntity.name, { value: 38 }),
      );
      mockGetHolidayByDate.mockResolvedValue(null);

      const user = new UserEntity({ uuid: uuidV4() });
      const baseCurrency = currencyBTC;
      const side = OrderSide.BUY;
      const amount = 1;
      const amountCurrency = currencyBRL;

      const testScript = () =>
        sut.execute(user, amount, amountCurrency, baseCurrency, side);

      await expect(testScript).rejects.toThrow(
        QuotationAmountUnderMinAmountException,
      );
      expect(mockGetAllActiveIsTrue).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
      expect(mockGetSpreadsByCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetTax).toHaveBeenCalledTimes(1);
      expect(mockGetHolidayByDate).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0008 - Should get quotation BTC-BRL', async () => {
      const currencyBTC = new CurrencyEntity({ symbol: 'BTC', decimal: 8 });
      const currencyBRL = new CurrencyEntity({
        symbol: operationCurrencySymbol,
      });
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          {
            buy: 100200.15,
            sell: 100200.15,
            composedBy: null,
            baseCurrency: currencyBTC,
            quoteCurrency: currencyBRL,
          },
        );
      const spread = await SpreadFactory.create<SpreadEntity>(
        SpreadEntity.name,
        { buy: 100, sell: 100 },
      );

      const {
        sut,
        mockGetSpreadsByCurrencies,
        mockGetAllActiveIsTrue,
        mockGetStreamQuotation,
        mockGetTax,
        mockGetHolidayByDate,
      } = makeSut();

      mockGetAllActiveIsTrue.mockResolvedValue([streamQuotation.streamPair]);
      mockGetStreamQuotation.mockResolvedValue(streamQuotation);
      mockGetSpreadsByCurrencies.mockResolvedValue([spread]);
      mockGetTax.mockResolvedValue(
        await TaxFactory.create<TaxEntity>(TaxEntity.name, { value: 38 }),
      );
      mockGetHolidayByDate.mockResolvedValue(null);

      const user = new UserEntity({ uuid: uuidV4() });
      const baseCurrency = currencyBTC;
      const side = OrderSide.BUY;
      const amount = 100000;
      const amountCurrency = currencyBRL;

      const result = await sut.execute(
        user,
        amount,
        amountCurrency,
        baseCurrency,
        side,
      );

      expect(result).toBeDefined();
      expect(result.id).not.toBeNull();
      expect(result.provider.name).toBe(streamQuotation.gatewayName);
      expect(result.side).toBe(side);
      expect(result.price).toBe(10020015);
      expect(result.priceBuy).toBe(10160226);
      expect(result.priceSell).toBe(9883621);
      expect(result.partialBuy).toBe(98620);
      expect(result.partialSell).toBe(101380);
      expect(result.iof.value).not.toBeNull();
      expect(result.iofAmount).toBe(380);
      expect(result.spreads.length).toBe(1);
      expect(result.spreads[0]).toMatchObject(spread);
      expect(result.spreadBuy).toBe(spread.buy);
      expect(result.spreadSell).toBe(spread.sell);
      expect(result.spreadAmountBuy).toBe(1000);
      expect(result.spreadAmountSell).toBe(1000);
      expect(result.quoteCurrency).toMatchObject(currencyBRL);
      expect(result.quoteAmountBuy).toBe(amount);
      expect(result.quoteAmountSell).toBe(amount);
      expect(result.baseCurrency).toMatchObject(baseCurrency);
      expect(result.baseAmountBuy).toBe(984230);
      expect(result.baseAmountSell).toBe(1011775);
      expect(mockGetAllActiveIsTrue).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
      expect(mockGetSpreadsByCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetTax).toHaveBeenCalledTimes(1);
      expect(mockGetHolidayByDate).toHaveBeenCalledTimes(1);
    });

    it('TC0009 - Should get quotation BTC-BTC', async () => {
      const currencyBTC = new CurrencyEntity({ symbol: 'BTC', decimal: 8 });
      const currencyBRL = new CurrencyEntity({
        symbol: operationCurrencySymbol,
      });
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          {
            buy: 100200.15,
            sell: 100200.15,
            composedBy: null,
            baseCurrency: currencyBTC,
            quoteCurrency: currencyBRL,
          },
        );
      const spread = await SpreadFactory.create<SpreadEntity>(
        SpreadEntity.name,
        { buy: 100, sell: 100 },
      );

      const {
        sut,
        mockGetSpreadsByCurrencies,
        mockGetAllActiveIsTrue,
        mockGetStreamQuotation,
        mockGetTax,
        mockGetHolidayByDate,
      } = makeSut();

      mockGetAllActiveIsTrue.mockResolvedValue([streamQuotation.streamPair]);
      mockGetStreamQuotation.mockResolvedValue(streamQuotation);
      mockGetSpreadsByCurrencies.mockResolvedValue([spread]);
      mockGetTax.mockResolvedValue(
        await TaxFactory.create<TaxEntity>(TaxEntity.name, { value: 38 }),
      );
      mockGetHolidayByDate.mockResolvedValue(null);

      const user = new UserEntity({ uuid: uuidV4() });
      const baseCurrency = currencyBTC;
      const side = OrderSide.BUY;
      const amount = 1000000;
      const amountCurrency = currencyBTC;

      const result = await sut.execute(
        user,
        amount,
        amountCurrency,
        baseCurrency,
        side,
      );

      expect(result).toBeDefined();
      expect(result.id).not.toBeNull();
      expect(result.provider.name).toBe(streamQuotation.gatewayName);
      expect(result.side).toBe(side);
      expect(result.price).toBe(10020015);
      expect(result.priceBuy).toBe(10158291);
      expect(result.priceSell).toBe(9881739);
      expect(result.partialBuy).toBe(100200);
      expect(result.partialSell).toBe(100200);
      expect(result.iof.value).not.toBeNull();
      expect(result.iofAmount).toBe(381);
      expect(result.spreads.length).toBe(1);
      expect(result.spreads[0]).toMatchObject(spread);
      expect(result.spreadBuy).toBe(spread.buy);
      expect(result.spreadSell).toBe(spread.sell);
      expect(result.spreadAmountBuy).toBe(1002);
      expect(result.spreadAmountSell).toBe(1002);
      expect(result.quoteCurrency).toMatchObject(currencyBRL);
      expect(result.quoteAmountBuy).toBe(101583);
      expect(result.quoteAmountSell).toBe(98817);
      expect(result.baseCurrency).toMatchObject(baseCurrency);
      expect(result.baseAmountBuy).toBe(amount);
      expect(result.baseAmountSell).toBe(amount);
      expect(mockGetAllActiveIsTrue).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
      expect(mockGetSpreadsByCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetTax).toHaveBeenCalledTimes(1);
      expect(mockGetHolidayByDate).toHaveBeenCalledTimes(1);
    });

    it('TC0010 - Should get quotation BTC-BRL with spread buy = 0', async () => {
      const currencyBTC = new CurrencyEntity({ symbol: 'BTC', decimal: 8 });
      const currencyBRL = new CurrencyEntity({
        symbol: operationCurrencySymbol,
      });
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          {
            buy: 100200.15,
            sell: 100200.15,
            composedBy: null,
            baseCurrency: currencyBTC,
            quoteCurrency: currencyBRL,
          },
        );
      const spread = await SpreadFactory.create<SpreadEntity>(
        SpreadEntity.name,
        { buy: 0, sell: 100 },
      );

      const {
        sut,
        mockGetSpreadsByCurrencies,
        mockGetAllActiveIsTrue,
        mockGetStreamQuotation,
        mockGetTax,
        mockGetHolidayByDate,
      } = makeSut();

      mockGetAllActiveIsTrue.mockResolvedValue([streamQuotation.streamPair]);
      mockGetStreamQuotation.mockResolvedValue(streamQuotation);
      mockGetSpreadsByCurrencies.mockResolvedValue([spread]);
      mockGetTax.mockResolvedValue(
        await TaxFactory.create<TaxEntity>(TaxEntity.name, { value: 38 }),
      );
      mockGetHolidayByDate.mockResolvedValue(null);

      const user = new UserEntity({ uuid: uuidV4() });
      const baseCurrency = currencyBTC;
      const side = OrderSide.BUY;
      const amount = 100000;
      const amountCurrency = currencyBRL;

      const result = await sut.execute(
        user,
        amount,
        amountCurrency,
        baseCurrency,
        side,
      );

      expect(result).toBeDefined();
      expect(result.id).not.toBeNull();
      expect(result.provider.name).toBe(streamQuotation.gatewayName);
      expect(result.side).toBe(side);
      expect(result.price).toBe(10020015);
      expect(result.priceBuy).toBe(10058236);
      expect(result.priceSell).toBe(9883621);
      expect(result.partialBuy).toBe(99620);
      expect(result.partialSell).toBe(101380);
      expect(result.iof.value).not.toBeNull();
      expect(result.iofAmount).toBe(380);
      expect(result.spreads.length).toBe(1);
      expect(result.spreads[0]).toMatchObject(spread);
      expect(result.spreadBuy).toBe(spread.buy);
      expect(result.spreadSell).toBe(spread.sell);
      expect(result.spreadAmountBuy).toBe(0);
      expect(result.spreadAmountSell).toBe(1000);
      expect(result.quoteCurrency).toMatchObject(currencyBRL);
      expect(result.quoteAmountBuy).toBe(amount);
      expect(result.quoteAmountSell).toBe(amount);
      expect(result.baseCurrency).toMatchObject(baseCurrency);
      expect(result.baseAmountBuy).toBe(994210);
      expect(result.baseAmountSell).toBe(1011775);
      expect(mockGetAllActiveIsTrue).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
      expect(mockGetSpreadsByCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetTax).toHaveBeenCalledTimes(1);
      expect(mockGetHolidayByDate).toHaveBeenCalledTimes(1);
    });

    it('TC0011 - Should get quotation BTC-BRL with spread sell = 0', async () => {
      const currencyBTC = new CurrencyEntity({ symbol: 'BTC', decimal: 8 });
      const currencyBRL = new CurrencyEntity({
        symbol: operationCurrencySymbol,
      });
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          {
            buy: 100200.15,
            sell: 100200.15,
            composedBy: null,
            baseCurrency: currencyBTC,
            quoteCurrency: currencyBRL,
          },
        );
      const spread = await SpreadFactory.create<SpreadEntity>(
        SpreadEntity.name,
        { buy: 100, sell: 0 },
      );

      const {
        sut,
        mockGetSpreadsByCurrencies,
        mockGetAllActiveIsTrue,
        mockGetStreamQuotation,
        mockGetTax,
        mockGetHolidayByDate,
      } = makeSut();

      mockGetAllActiveIsTrue.mockResolvedValue([streamQuotation.streamPair]);
      mockGetStreamQuotation.mockResolvedValue(streamQuotation);
      mockGetSpreadsByCurrencies.mockResolvedValue([spread]);
      mockGetTax.mockResolvedValue(
        await TaxFactory.create<TaxEntity>(TaxEntity.name, { value: 38 }),
      );
      mockGetHolidayByDate.mockResolvedValue(null);

      const user = new UserEntity({ uuid: uuidV4() });
      const baseCurrency = currencyBTC;
      const side = OrderSide.BUY;
      const amount = 100000;
      const amountCurrency = currencyBRL;

      const result = await sut.execute(
        user,
        amount,
        amountCurrency,
        baseCurrency,
        side,
      );

      expect(result).toBeDefined();
      expect(result.id).not.toBeNull();
      expect(result.provider.name).toBe(streamQuotation.gatewayName);
      expect(result.side).toBe(side);
      expect(result.price).toBe(10020015);
      expect(result.priceBuy).toBe(10160226);
      expect(result.priceSell).toBe(9982083);
      expect(result.partialBuy).toBe(98620);
      expect(result.partialSell).toBe(100380);
      expect(result.iof.value).not.toBeNull();
      expect(result.iofAmount).toBe(380);
      expect(result.spreads.length).toBe(1);
      expect(result.spreads[0]).toMatchObject(spread);
      expect(result.spreadBuy).toBe(spread.buy);
      expect(result.spreadSell).toBe(spread.sell);
      expect(result.spreadAmountBuy).toBe(1000);
      expect(result.spreadAmountSell).toBe(0);
      expect(result.quoteCurrency).toMatchObject(currencyBRL);
      expect(result.quoteAmountBuy).toBe(amount);
      expect(result.quoteAmountSell).toBe(amount);
      expect(result.baseCurrency).toMatchObject(baseCurrency);
      expect(result.baseAmountBuy).toBe(984230);
      expect(result.baseAmountSell).toBe(1001795);
      expect(mockGetAllActiveIsTrue).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
      expect(mockGetSpreadsByCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetTax).toHaveBeenCalledTimes(1);
      expect(mockGetHolidayByDate).toHaveBeenCalledTimes(1);
    });

    it('TC0012 - Should get quotation BTC-BRL with holiday and spread off market', async () => {
      const currencyBTC = new CurrencyEntity({ symbol: 'BTC', decimal: 8 });
      const currencyBRL = new CurrencyEntity({
        symbol: operationCurrencySymbol,
      });
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          {
            buy: 100200.15,
            sell: 100200.15,
            composedBy: null,
            baseCurrency: currencyBTC,
            quoteCurrency: currencyBRL,
          },
        );
      const spread = await SpreadFactory.create<SpreadEntity>(
        SpreadEntity.name,
        { offMarketBuy: 100, offMarketSell: 100 },
      );

      const {
        sut,
        mockGetSpreadsByCurrencies,
        mockGetAllActiveIsTrue,
        mockGetStreamQuotation,
        mockGetTax,
        mockGetHolidayByDate,
      } = makeSut();

      mockGetAllActiveIsTrue.mockResolvedValue([streamQuotation.streamPair]);
      mockGetStreamQuotation.mockResolvedValue(streamQuotation);
      mockGetSpreadsByCurrencies.mockResolvedValue([spread]);
      mockGetTax.mockResolvedValue(
        await TaxFactory.create<TaxEntity>(TaxEntity.name, { value: 38 }),
      );
      mockGetHolidayByDate.mockResolvedValue({ id: uuidV4() });

      const user = new UserEntity({ uuid: uuidV4() });
      const baseCurrency = currencyBTC;
      const side = OrderSide.BUY;
      const amount = 100000;
      const amountCurrency = currencyBRL;

      const result = await sut.execute(
        user,
        amount,
        amountCurrency,
        baseCurrency,
        side,
      );

      expect(result).toBeDefined();
      expect(result.id).not.toBeNull();
      expect(result.provider.name).toBe(streamQuotation.gatewayName);
      expect(result.side).toBe(side);
      expect(result.price).toBe(10020015);
      expect(result.priceBuy).toBe(10160226);
      expect(result.priceSell).toBe(9883621);
      expect(result.partialBuy).toBe(98620);
      expect(result.partialSell).toBe(101380);
      expect(result.iof.value).not.toBeNull();
      expect(result.iofAmount).toBe(380);
      expect(result.spreads.length).toBe(1);
      expect(result.spreads[0]).toMatchObject(spread);
      expect(result.spreadBuy).toBe(spread.offMarketBuy);
      expect(result.spreadSell).toBe(spread.offMarketSell);
      expect(result.spreadAmountBuy).toBe(1000);
      expect(result.spreadAmountSell).toBe(1000);
      expect(result.quoteCurrency).toMatchObject(currencyBRL);
      expect(result.quoteAmountBuy).toBe(amount);
      expect(result.quoteAmountSell).toBe(amount);
      expect(result.baseCurrency).toMatchObject(baseCurrency);
      expect(result.baseAmountBuy).toBe(984230);
      expect(result.baseAmountSell).toBe(1011775);
      expect(mockGetAllActiveIsTrue).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
      expect(mockGetSpreadsByCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetTax).toHaveBeenCalledTimes(1);
      expect(mockGetHolidayByDate).toHaveBeenCalledTimes(1);
    });

    it('TC0013 - Should get quotation BTC-BRL in off market time and without spread off market', async () => {
      const currencyBTC = new CurrencyEntity({ symbol: 'BTC', decimal: 8 });
      const currencyBRL = new CurrencyEntity({
        symbol: operationCurrencySymbol,
      });
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          {
            buy: 100200.15,
            sell: 100200.15,
            composedBy: null,
            baseCurrency: currencyBTC,
            quoteCurrency: currencyBRL,
          },
        );
      const spread = await SpreadFactory.create<SpreadEntity>(
        SpreadEntity.name,
        { buy: 100, sell: 100, offMarketBuy: null, offMarketSell: null },
      );
      spread.isInOffMarketInterval = () => true;

      const {
        sut,
        mockGetSpreadsByCurrencies,
        mockGetAllActiveIsTrue,
        mockGetStreamQuotation,
        mockGetTax,
        mockGetHolidayByDate,
      } = makeSut();

      mockGetAllActiveIsTrue.mockResolvedValue([streamQuotation.streamPair]);
      mockGetStreamQuotation.mockResolvedValue(streamQuotation);
      mockGetSpreadsByCurrencies.mockResolvedValue([spread]);
      mockGetTax.mockResolvedValue(
        await TaxFactory.create<TaxEntity>(TaxEntity.name, { value: 38 }),
      );
      mockGetHolidayByDate.mockResolvedValue({});

      const user = new UserEntity({ uuid: uuidV4() });
      const baseCurrency = currencyBTC;
      const side = OrderSide.BUY;
      const amount = 100000;
      const amountCurrency = currencyBRL;

      const result = await sut.execute(
        user,
        amount,
        amountCurrency,
        baseCurrency,
        side,
      );

      expect(result).toBeDefined();
      expect(result.id).not.toBeNull();
      expect(result.provider.name).toBe(streamQuotation.gatewayName);
      expect(result.side).toBe(side);
      expect(result.price).toBe(10020015);
      expect(result.priceBuy).toBe(10160226);
      expect(result.priceSell).toBe(9883621);
      expect(result.partialBuy).toBe(98620);
      expect(result.partialSell).toBe(101380);
      expect(result.iof.value).not.toBeNull();
      expect(result.iofAmount).toBe(380);
      expect(result.spreads.length).toBe(1);
      expect(result.spreads[0]).toMatchObject(spread);
      expect(result.spreadBuy).toBe(spread.buy);
      expect(result.spreadSell).toBe(spread.sell);
      expect(result.spreadAmountBuy).toBe(1000);
      expect(result.spreadAmountSell).toBe(1000);
      expect(result.quoteCurrency).toMatchObject(currencyBRL);
      expect(result.quoteAmountBuy).toBe(amount);
      expect(result.quoteAmountSell).toBe(amount);
      expect(result.baseCurrency).toMatchObject(baseCurrency);
      expect(result.baseAmountBuy).toBe(984230);
      expect(result.baseAmountSell).toBe(1011775);
      expect(mockGetAllActiveIsTrue).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
      expect(mockGetSpreadsByCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetTax).toHaveBeenCalledTimes(1);
      expect(mockGetHolidayByDate).toHaveBeenCalledTimes(1);
    });

    it('TC0014 - Should get quotation BTC-BRL with two spread', async () => {
      const currencyBTC = new CurrencyEntity({ symbol: 'BTC', decimal: 8 });
      const currencyBRL = new CurrencyEntity({
        symbol: operationCurrencySymbol,
      });
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          {
            buy: 100200.15,
            sell: 100200.15,
            baseCurrency: currencyBTC,
            quoteCurrency: currencyBRL,
          },
        );
      const spread = await SpreadFactory.create<SpreadEntity>(
        SpreadEntity.name,
        { buy: 100, sell: 100 },
      );

      const {
        sut,
        mockGetSpreadsByCurrencies,
        mockGetAllActiveIsTrue,
        mockGetStreamQuotation,
        mockGetTax,
        mockGetHolidayByDate,
      } = makeSut();

      mockGetAllActiveIsTrue.mockResolvedValue([streamQuotation.streamPair]);
      mockGetStreamQuotation.mockResolvedValue(streamQuotation);
      mockGetSpreadsByCurrencies.mockResolvedValue([spread, spread]);
      mockGetTax.mockResolvedValue(
        await TaxFactory.create<TaxEntity>(TaxEntity.name, { value: 38 }),
      );
      mockGetHolidayByDate.mockResolvedValue(null);

      const user = new UserEntity({ uuid: uuidV4() });
      const baseCurrency = currencyBTC;
      const side = OrderSide.BUY;
      const amount = 100000;
      const amountCurrency = currencyBRL;

      const result = await sut.execute(
        user,
        amount,
        amountCurrency,
        baseCurrency,
        side,
      );

      expect(result).toBeDefined();
      expect(result.id).not.toBeNull();
      expect(result.provider.name).toBe(streamQuotation.gatewayName);
      expect(result.side).toBe(side);
      expect(result.price).toBe(10020015);
      expect(result.priceBuy).toBe(10265357);
      expect(result.priceSell).toBe(9786127);
      expect(result.partialBuy).toBe(97610);
      expect(result.partialSell).toBe(102390);
      expect(result.iof.value).not.toBeNull();
      expect(result.iofAmount).toBe(380);
      expect(result.spreads.length).toBe(2);
      expect(result.spreads[0]).toMatchObject(spread);
      expect(result.spreads[1]).toMatchObject(spread);
      expect(result.spreadBuy).toBe(201);
      expect(result.spreadSell).toBe(201);
      expect(result.spreadAmountBuy).toBe(2010);
      expect(result.spreadAmountSell).toBe(2010);
      expect(result.quoteCurrency).toMatchObject(currencyBRL);
      expect(result.quoteAmountBuy).toBe(amount);
      expect(result.quoteAmountSell).toBe(amount);
      expect(result.baseCurrency).toMatchObject(baseCurrency);
      expect(result.baseAmountBuy).toBe(974150);
      expect(result.baseAmountSell).toBe(1021855);
      expect(mockGetAllActiveIsTrue).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
      expect(mockGetSpreadsByCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetTax).toHaveBeenCalledTimes(1);
      expect(mockGetHolidayByDate).toHaveBeenCalledTimes(1);
    });
  });
});
