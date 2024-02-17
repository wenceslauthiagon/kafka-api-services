import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { QuotationEntity, QuotationRepository } from '@zro/quotations/domain';
import { CreateQuotationUseCase as UseCase } from '@zro/quotations/application';
import { QuotationFactory } from '@zro/test/quotations/config';

describe('CreateQuotationUseCase', () => {
  const quotationRepository: QuotationRepository =
    createMock<QuotationRepository>();
  const getQuotation: jest.Mock = On(quotationRepository).get(
    method((mock) => mock.getById),
  );
  const mockCreateQuotationService: jest.Mock = On(quotationRepository).get(
    method((mock) => mock.create),
  );

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create quotation without params', async () => {
      const usecase = new UseCase(logger, quotationRepository);

      const testScript = () =>
        usecase.execute(
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        );

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(getQuotation).toHaveBeenCalledTimes(0);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should create quotation', async () => {
      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
      );

      getQuotation.mockResolvedValue(null);
      mockCreateQuotationService.mockResolvedValue(quotation);

      const usecase = new UseCase(logger, quotationRepository);

      const result = await usecase.execute(
        quotation.id,
        quotation.provider,
        quotation.streamPair,
        quotation.side,
        quotation.price,
        quotation.priceBuy,
        quotation.priceSell,
        quotation.partialBuy,
        quotation.partialSell,
        quotation.iof,
        quotation.iofAmount,
        quotation.spreads,
        quotation.spreadBuy,
        quotation.spreadSell,
        quotation.spreadAmountBuy,
        quotation.spreadAmountSell,
        quotation.quoteCurrency,
        quotation.quoteAmountBuy,
        quotation.quoteAmountSell,
        quotation.baseCurrency,
        quotation.baseAmountBuy,
        quotation.baseAmountSell,
        quotation.streamQuotation,
      );

      expect(result).toBeDefined();
      expect(result).toMatchObject(quotation);
      expect(getQuotation).toHaveBeenCalledTimes(1);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should create quotation with idempotency', async () => {
      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
      );

      getQuotation.mockResolvedValue(quotation);

      const usecase = new UseCase(logger, quotationRepository);

      const result = await usecase.execute(
        quotation.id,
        quotation.provider,
        quotation.streamPair,
        quotation.side,
        quotation.price,
        quotation.priceBuy,
        quotation.priceSell,
        quotation.partialBuy,
        quotation.partialSell,
        quotation.iof,
        quotation.iofAmount,
        quotation.spreads,
        quotation.spreadBuy,
        quotation.spreadSell,
        quotation.spreadAmountBuy,
        quotation.spreadAmountSell,
        quotation.quoteCurrency,
        quotation.quoteAmountBuy,
        quotation.quoteAmountSell,
        quotation.baseCurrency,
        quotation.baseAmountBuy,
        quotation.baseAmountSell,
        quotation.streamQuotation,
      );

      expect(result).toBeDefined();
      expect(result).toMatchObject(quotation);
      expect(getQuotation).toHaveBeenCalledTimes(1);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
    });
  });
});
