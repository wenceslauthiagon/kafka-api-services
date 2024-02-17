import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { GetStreamQuotationByBaseCurrencyUseCase } from '@zro/quotations/application';
import {
  StreamQuotationEntity,
  StreamQuotationRepository,
} from '@zro/quotations/domain';
import { CurrencyEntity } from '@zro/operations/domain';
import { CurrencyFactory } from '@zro/test/operations/config';
import { StreamQuotationFactory } from '@zro/test/quotations/config';

describe('GetStreamQuotationByBaseCurrencyUseCase', () => {
  const operationCurrencySymbol = 'BTC';
  const mockStreamQuotationRepository: StreamQuotationRepository =
    createMock<StreamQuotationRepository>();
  const mockGetByBaseCurrencyAndQuoteCurrency: jest.Mock = On(
    mockStreamQuotationRepository,
  ).get(method((mock) => mock.getByBaseCurrencyAndQuoteCurrency));

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get stream quotation without params', async () => {
      const usecase = new GetStreamQuotationByBaseCurrencyUseCase(
        logger,
        mockStreamQuotationRepository,
        operationCurrencySymbol,
      );

      const testScript = () => usecase.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByBaseCurrencyAndQuoteCurrency).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not get stream quotation with null stream quotation', async () => {
      const usecase = new GetStreamQuotationByBaseCurrencyUseCase(
        logger,
        mockStreamQuotationRepository,
        operationCurrencySymbol,
      );

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      mockGetByBaseCurrencyAndQuoteCurrency.mockResolvedValue([]);
      const result = await usecase.execute(baseCurrency);

      expect(result).toBeNull();
      expect(mockGetByBaseCurrencyAndQuoteCurrency).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should get stream quotation', async () => {
      const usecase = new GetStreamQuotationByBaseCurrencyUseCase(
        logger,
        mockStreamQuotationRepository,
        operationCurrencySymbol,
      );

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const streamQuotations = [
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
        ),
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
        ),
      ];

      const [streamQuotation] = streamQuotations.sort(
        (a, b) => a.streamPair.priority - b.streamPair.priority,
      );

      mockGetByBaseCurrencyAndQuoteCurrency.mockResolvedValue(streamQuotations);
      const result = await usecase.execute(baseCurrency);

      expect(result).toBeDefined();
      expect(result).toBe(streamQuotation);
      expect(mockGetByBaseCurrencyAndQuoteCurrency).toHaveBeenCalledTimes(1);
    });
  });
});
