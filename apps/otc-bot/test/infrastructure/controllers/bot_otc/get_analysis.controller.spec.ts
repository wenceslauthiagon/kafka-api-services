import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { AppModule } from '@zro/otc-bot/infrastructure/nest/modules/app.module';
import {
  BotOtcDatabaseRepository,
  BotOtcModel,
  BotOtcOrderDatabaseRepository,
  BotOtcOrderModel,
  GetBotOtcAnalysisMicroserviceController as Controller,
  OperationServiceKafka,
  QuotationServiceKafka,
} from '@zro/otc-bot/infrastructure';
import {
  BotOtcOrderRepository,
  BotOtcOrderState,
  BotOtcRepository,
} from '@zro/otc-bot/domain';
import { GetBotOtcAnalysisRequest } from '@zro/otc-bot/interface';
import { CryptoMarketFactory, RemittanceFactory } from '@zro/test/otc/config';
import { BotOtcFactory, BotOtcOrderFactory } from '@zro/test/otc-bot/config';
import { CryptoMarketEntity, RemittanceEntity } from '@zro/otc/domain';
import { KafkaContext } from '@nestjs/microservices';
import { CurrencyFactory } from '@zro/test/operations/config';
import { CurrencyEntity } from '@zro/operations/domain';
import { TaxEntity } from '@zro/quotations/domain';
import { TaxFactory } from '@zro/test/quotations/config';

describe('GetBotOtcAnalysisMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let botOtcRepository: BotOtcRepository;
  let botOtcOrderRepository: BotOtcOrderRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetCurrency: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyById),
  );

  const quotationService: QuotationServiceKafka =
    createMock<QuotationServiceKafka>();
  const mockGetTax: jest.Mock = On(quotationService).get(
    method((mock) => mock.getTaxByName),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    botOtcRepository = new BotOtcDatabaseRepository();
    botOtcOrderRepository = new BotOtcOrderDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('Update Bot Otc Order by remittance.', () => {
    describe('With invalid parameters.', () => {
      it('TC0001 - Should throw InvalidDataFormatException if missing params.', async () => {
        const message: GetBotOtcAnalysisRequest = {
          id: null,
          createdAtStart: null,
          createdAtEnd: null,
        };

        const testScript = () =>
          controller.execute(
            botOtcRepository,
            botOtcOrderRepository,
            operationService,
            quotationService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockGetCurrency).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters.', () => {
      it('TC0002 - Should get Bot Otc analysis successfully.', async () => {
        const botOtc = await BotOtcFactory.create<BotOtcModel>(
          BotOtcModel.name,
        );

        const sellMarket = await CryptoMarketFactory.create<CryptoMarketEntity>(
          CryptoMarketEntity.name,
          {
            priceSignificantDigits: 8,
          },
        );

        const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
          {
            decimal: 8,
          },
        );

        const buyRemittance = await RemittanceFactory.create<RemittanceEntity>(
          RemittanceEntity.name,
          {
            bankQuote: 50000,
          },
        );

        await BotOtcOrderFactory.create<BotOtcOrderModel>(
          BotOtcOrderModel.name,
          {
            botOtcId: botOtc.id,
            baseCurrency,
            market: sellMarket,
            sellPriceSignificantDigits: sellMarket.priceSignificantDigits,
            sellExecutedAmount: 100000000,
            sellExecutedPrice: 15000000000000,
            buyExecutedAmount: 100000000,
            buyExecutedPrice: 3000000000,
            buyPriceSignificantDigits: 5,
            buyRemittance,
            buyBankQuote: buyRemittance.bankQuote,
            createdAt: new Date(),
            state: BotOtcOrderState.COMPLETED,
          },
        );

        const iof = await TaxFactory.create<TaxEntity>(TaxEntity.name, {
          value: 38,
        });

        mockGetTax.mockResolvedValue(iof);
        mockGetCurrency.mockResolvedValue(baseCurrency);

        const message: GetBotOtcAnalysisRequest = {
          id: botOtc.id,
          createdAtStart: null,
          createdAtEnd: null,
        };

        const response = await controller.execute(
          botOtcRepository,
          botOtcOrderRepository,
          operationService,
          quotationService,
          logger,
          message,
          ctx,
        );

        expect(response.value).toBeDefined();
        // Profit should be 150,000.0000 - (30,000.0000 * 5.0000 * 1.0038) = 570.0000
        expect(response.value.profit).toBe(-5700000);
        // Cost should be 150,000.0000 - profit
        expect(response.value.volume).toBe(1505700000);
        // Profit margin should be profit/cost
        expect(response.value.profitMargin).toBe(-38);
        expect(mockGetCurrency).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
