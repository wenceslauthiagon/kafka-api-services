import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { CurrencyEntity } from '@zro/operations/domain';
import { StreamQuotationEntity } from '@zro/quotations/domain';
import {
  QuotationService,
  HistoricalCryptoPriceGateway,
  GetCryptoPriceByCurrencyAndDateUseCase as UseCase,
} from '@zro/otc/application';
import { CurrencyFactory } from '@zro/test/operations/config';
import { StreamQuotationFactory } from '@zro/test/quotations/config';

describe('GetCryptoPriceByCurrencyAndDateUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeService = () => {
    const quotationService: QuotationService = createMock<QuotationService>();
    const mockGetQuotation: jest.Mock = On(quotationService).get(
      method((mock) => mock.getStreamQuotationByBaseCurrency),
    );

    return {
      quotationService,
      mockGetQuotation,
    };
  };

  const makeGateway = () => {
    const historicalCryptoPriceGateway: HistoricalCryptoPriceGateway =
      createMock<HistoricalCryptoPriceGateway>();
    const mockGetHistoricalCryptoPrice: jest.Mock = On(
      historicalCryptoPriceGateway,
    ).get(method((mock) => mock.getHistoricalCryptoPrice));

    return {
      historicalCryptoPriceGateway,
      mockGetHistoricalCryptoPrice,
    };
  };

  const makeSut = () => {
    const { quotationService, mockGetQuotation } = makeService();

    const { historicalCryptoPriceGateway, mockGetHistoricalCryptoPrice } =
      makeGateway();

    const sut = new UseCase(
      logger,
      quotationService,
      historicalCryptoPriceGateway,
    );

    return {
      sut,
      mockGetQuotation,
      mockGetHistoricalCryptoPrice,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params', async () => {
      const { sut, mockGetHistoricalCryptoPrice } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const test = [
        () => sut.execute(null, null),
        () => sut.execute(null, new Date()),
        () => sut.execute(currency, null),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(mockGetHistoricalCryptoPrice).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get crypto price successfully if date is today', async () => {
      const { sut, mockGetHistoricalCryptoPrice, mockGetQuotation } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const quotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
        );

      mockGetQuotation.mockResolvedValueOnce(quotation);

      const response = await sut.execute(currency, new Date());

      expect(response).toBeDefined();
      expect(mockGetHistoricalCryptoPrice).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should get crypto price successfully if date is not today', async () => {
      const { sut, mockGetHistoricalCryptoPrice, mockGetQuotation } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const response = await sut.execute(currency, faker.date.past());

      expect(response).toBeDefined();
      expect(mockGetHistoricalCryptoPrice).toHaveBeenCalledTimes(1);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
    });
  });
});
