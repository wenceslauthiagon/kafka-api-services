import { KafkaContext } from '@nestjs/microservices';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { QuotationEntity } from '@zro/quotations/domain';
import {
  CreateQuotationMicroserviceController as Controller,
  QuotationDatabaseRepository,
} from '@zro/quotations/infrastructure';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import { CreateQuotationRequest } from '@zro/quotations/interface';
import { QuotationFactory } from '@zro/test/quotations/config';

describe('CreateQuotationMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  const quotationRepository = new QuotationDatabaseRepository();

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateQuotation', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create quotation successfully', async () => {
        const quotation = await QuotationFactory.create<QuotationEntity>(
          QuotationEntity.name,
        );

        const message: CreateQuotationRequest = {
          id: quotation.id,
          providerName: quotation.provider.name,
          streamPairId: quotation.streamPair.id,
          side: quotation.side,
          price: quotation.price,
          priceBuy: quotation.priceBuy,
          priceSell: quotation.priceSell,
          partialBuy: quotation.partialBuy,
          partialSell: quotation.partialSell,
          iofId: quotation.iof.id,
          iofAmount: quotation.iofAmount,
          spreadIds: quotation.spreads.map(({ id }) => id),
          spreadBuy: quotation.spreadBuy,
          spreadSell: quotation.spreadSell,
          spreadAmountBuy: quotation.spreadAmountBuy,
          spreadAmountSell: quotation.spreadAmountSell,
          quoteCurrencyId: quotation.quoteCurrency.id,
          quoteCurrencyDecimal: quotation.quoteCurrency.decimal,
          quoteCurrencySymbol: quotation.quoteCurrency.symbol,
          quoteCurrencyTitle: quotation.quoteCurrency.title,
          quoteAmountBuy: quotation.quoteAmountBuy,
          quoteAmountSell: quotation.quoteAmountSell,
          baseCurrencyId: quotation.baseCurrency.id,
          baseCurrencyDecimal: quotation.baseCurrency.decimal,
          baseCurrencySymbol: quotation.baseCurrency.symbol,
          baseCurrencyTitle: quotation.baseCurrency.title,
          baseAmountBuy: quotation.baseAmountBuy,
          baseAmountSell: quotation.baseAmountSell,
          streamQuotation: quotation.streamQuotation,
        };

        const result = await controller.execute(
          quotationRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(quotation.id);
        expect(result.value.price).toBe(quotation.price);
        expect(result.value.priceBuy).toBe(quotation.priceBuy);
        expect(result.value.priceSell).toBe(quotation.priceSell);
        expect(result.value.side).toBe(quotation.side);
        expect(result.value.partialBuy).toBe(quotation.partialBuy);
        expect(result.value.partialSell).toBe(quotation.partialSell);
        expect(result.value.iofAmount).toBe(quotation.iofAmount);
        expect(result.value.spreadIds.length).toBe(quotation.spreads.length);
        expect(result.value.spreadIds).toMatchObject(
          quotation.spreads.map(({ id }) => id),
        );
        expect(result.value.spreadBuy).toBe(quotation.spreadBuy);
        expect(result.value.spreadSell).toBe(quotation.spreadSell);
        expect(result.value.spreadAmountBuy).toBe(quotation.spreadAmountBuy);
        expect(result.value.spreadAmountSell).toBe(quotation.spreadAmountSell);
        expect(result.value.quoteAmountBuy).toBe(quotation.quoteAmountBuy);
        expect(result.value.quoteAmountSell).toBe(quotation.quoteAmountSell);
        expect(result.value.quoteCurrencyId).toBe(quotation.quoteCurrency.id);
        expect(result.value.baseAmountBuy).toBe(quotation.baseAmountBuy);
        expect(result.value.baseAmountSell).toBe(quotation.baseAmountSell);
        expect(result.value.baseCurrencyId).toBe(quotation.baseCurrency.id);
        expect(result.value.createdAt).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
