import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { ConfigService } from '@nestjs/config';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  formatValueFromFloatToInt,
  PrometheusGetResponse,
  PrometheusService,
} from '@zro/common';
import { OrderSide } from '@zro/otc/domain';
import {
  QuotationTrendEntity,
  QuotationTrendResolution,
  QuotationTrendWindow,
} from '@zro/quotations/domain';
import { GetTrendsByWindowAndResolutionAndBaseCurrenciesRequest } from '@zro/quotations/interface';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import {
  GetTrendsByWindowAndResolutionAndBaseCurrenciesMicroserviceController as Controller,
  StreamPairDatabaseRepository,
  OperationServiceKafka,
  StreamPairModel,
  GetTrendsByWindowAndResolutionAndBaseCurrenciesConfig,
} from '@zro/quotations/infrastructure';
import {
  QuotationTrendFactory,
  StreamPairFactory,
} from '@zro/test/quotations/config';

describe('GetTrendsByWindowAndResolutionAndBaseCurrenciesMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let configService: ConfigService<GetTrendsByWindowAndResolutionAndBaseCurrenciesConfig>;
  const streamPairRepository = new StreamPairDatabaseRepository();

  const prometheusService: PrometheusService = createMock<PrometheusService>();
  const mockGetPrometheusService: jest.Mock = On(prometheusService).get(
    method((mock) => mock.get),
  );
  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetCurrencyOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyBySymbol),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrometheusService)
      .useValue(prometheusService)
      .compile();
    configService = module.get(ConfigService);
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetByBaseCurrency', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get trends successfully', async () => {
        const streamPair = await StreamPairFactory.create<StreamPairModel>(
          StreamPairModel.name,
        );

        const quotationTrendBuy =
          await QuotationTrendFactory.create<QuotationTrendEntity>(
            QuotationTrendEntity.name,
            { side: OrderSide.BUY, gatewayName: streamPair.gatewayName },
          );
        quotationTrendBuy.baseCurrency.id = streamPair.baseCurrencyId;
        quotationTrendBuy.quoteCurrency.id = streamPair.quoteCurrencyId;
        quotationTrendBuy.quoteCurrency.symbol = configService.get<string>(
          'APP_OPERATION_CURRENCY_SYMBOL',
        );

        const quotationTrendSell =
          await QuotationTrendFactory.create<QuotationTrendEntity>(
            QuotationTrendEntity.name,
            {
              side: OrderSide.SELL,
              gatewayName: quotationTrendBuy.gatewayName,
              timestamp: quotationTrendBuy.timestamp,
              baseCurrency: quotationTrendBuy.baseCurrency,
              quoteCurrency: quotationTrendBuy.quoteCurrency,
            },
          );

        mockGetCurrencyOperationService
          .mockResolvedValueOnce(quotationTrendBuy.baseCurrency)
          .mockResolvedValueOnce(quotationTrendBuy.quoteCurrency);

        const keys: PrometheusGetResponse[] = [
          {
            metric: {
              labels: {
                baseCurrency: quotationTrendBuy.baseCurrency.symbol,
                quoteCurrency: quotationTrendBuy.quoteCurrency.symbol,
                gateway: quotationTrendBuy.gatewayName,
                tier: quotationTrendBuy.amount,
                side: quotationTrendBuy.side,
              },
            },
            values: [
              {
                time: quotationTrendBuy.timestamp,
                value: quotationTrendBuy.price,
              },
            ],
          },
          {
            metric: {
              labels: {
                baseCurrency: quotationTrendSell.baseCurrency.symbol,
                quoteCurrency: quotationTrendSell.quoteCurrency.symbol,
                gateway: quotationTrendSell.gatewayName,
                tier: quotationTrendSell.amount,
                side: quotationTrendSell.side,
              },
            },
            values: [
              {
                time: quotationTrendSell.timestamp,
                value: quotationTrendSell.price,
              },
            ],
          },
        ];
        mockGetPrometheusService.mockResolvedValue(keys);

        const message: GetTrendsByWindowAndResolutionAndBaseCurrenciesRequest =
          {
            window: QuotationTrendWindow['QTW_1d'],
            resolution: QuotationTrendResolution['QTR_12h'],
            baseCurrencySymbols: [quotationTrendBuy.baseCurrency.symbol],
          };

        const result = await controller.execute(
          streamPairRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.length).toBe(1);
        expect(result.value[0].baseCurrencySymbol).toBe(
          quotationTrendBuy.baseCurrency.symbol,
        );
        expect(result.value[0].quoteCurrencySymbol).toBe(
          quotationTrendBuy.quoteCurrency.symbol,
        );
        expect(result.value[0].points.length).toBe(1);
        expect(result.value[0].points[0].buy).toBe(
          formatValueFromFloatToInt(
            quotationTrendBuy.price,
            quotationTrendBuy.quoteCurrency.decimal,
          ),
        );
        expect(result.value[0].points[0].sell).toBe(
          formatValueFromFloatToInt(
            quotationTrendSell.price,
            quotationTrendSell.quoteCurrency.decimal,
          ),
        );
        expect(result.value[0].points[0].price).toBe(
          formatValueFromFloatToInt(
            (quotationTrendBuy.price + quotationTrendSell.price) / 2,
            quotationTrendSell.quoteCurrency.decimal,
          ),
        );
      });

      it('TC0002 - Should get just trend buy successfully', async () => {
        const streamPair = await StreamPairFactory.create<StreamPairModel>(
          StreamPairModel.name,
        );

        const quotationTrendBuy =
          await QuotationTrendFactory.create<QuotationTrendEntity>(
            QuotationTrendEntity.name,
            { side: OrderSide.BUY },
          );
        quotationTrendBuy.gatewayName = streamPair.gatewayName;
        quotationTrendBuy.baseCurrency.id = streamPair.baseCurrencyId;
        quotationTrendBuy.quoteCurrency.id = streamPair.quoteCurrencyId;
        quotationTrendBuy.quoteCurrency.symbol = configService.get<string>(
          'APP_OPERATION_CURRENCY_SYMBOL',
        );

        mockGetCurrencyOperationService
          .mockResolvedValueOnce(quotationTrendBuy.baseCurrency)
          .mockResolvedValueOnce(quotationTrendBuy.quoteCurrency);

        const keys: PrometheusGetResponse[] = [
          {
            metric: {
              labels: {
                baseCurrency: quotationTrendBuy.baseCurrency.symbol,
                quoteCurrency: quotationTrendBuy.quoteCurrency.symbol,
                gateway: quotationTrendBuy.gatewayName,
                tier: quotationTrendBuy.amount,
                side: quotationTrendBuy.side,
              },
            },
            values: [
              {
                time: quotationTrendBuy.timestamp,
                value: quotationTrendBuy.price,
              },
            ],
          },
        ];
        mockGetPrometheusService.mockResolvedValue(keys);

        const message: GetTrendsByWindowAndResolutionAndBaseCurrenciesRequest =
          {
            window: QuotationTrendWindow['QTW_1d'],
            resolution: QuotationTrendResolution['QTR_12h'],
            baseCurrencySymbols: [quotationTrendBuy.baseCurrency.symbol],
          };

        const result = await controller.execute(
          streamPairRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.length).toBe(1);
        expect(result.value[0].baseCurrencySymbol).toBe(
          quotationTrendBuy.baseCurrency.symbol,
        );
        expect(result.value[0].quoteCurrencySymbol).toBe(
          quotationTrendBuy.quoteCurrency.symbol,
        );
        expect(result.value[0].points.length).toBe(1);
        expect(result.value[0].points[0].buy).toBe(
          formatValueFromFloatToInt(
            quotationTrendBuy.price,
            quotationTrendBuy.quoteCurrency.decimal,
          ),
        );
        expect(result.value[0].points[0].sell).toBeNull();
        expect(result.value[0].points[0].price).toBeNull();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
