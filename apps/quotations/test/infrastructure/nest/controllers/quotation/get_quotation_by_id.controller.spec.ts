import { KafkaContext } from '@nestjs/microservices';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import {
  GetQuotationByIdMicroserviceController as Controller,
  QuotationDatabaseRepository,
  QuotationModel,
} from '@zro/quotations/infrastructure';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import { GetQuotationByIdRequest } from '@zro/quotations/interface';
import { QuotationFactory } from '@zro/test/quotations/config';

describe('GetQuotationByIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  const quotationRepository = new QuotationDatabaseRepository();

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetQuotationById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get quotation by id successfully', async () => {
        const quotation = (
          await QuotationFactory.create<QuotationModel>(QuotationModel.name)
        ).toDomain();

        const message: GetQuotationByIdRequest = {
          id: quotation.id,
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
        expect(result.value.providerName).toBe(quotation.provider.name);
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
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
