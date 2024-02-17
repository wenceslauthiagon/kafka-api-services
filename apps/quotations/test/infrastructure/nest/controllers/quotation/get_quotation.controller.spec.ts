import { ConfigService } from '@nestjs/config';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { KafkaContext } from '@nestjs/microservices';
import { RedisKey, RedisService, defaultLogger as logger } from '@zro/common';
import {
  StreamPairEntity,
  StreamQuotationEntity,
  TaxEntity,
} from '@zro/quotations/domain';
import { UserEntity } from '@zro/users/domain';
import { OrderSide, SpreadEntity } from '@zro/otc/domain';
import { CurrencyEntity } from '@zro/operations/domain';
import {
  GetQuotationMicroserviceController as Controller,
  HolidayDatabaseRepository,
  OtcServiceKafka,
} from '@zro/quotations/infrastructure';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import { GetQuotationRequest } from '@zro/quotations/interface';
import {
  StreamPairFactory,
  StreamQuotationFactory,
  TaxFactory,
} from '@zro/test/quotations/config';
import { UserFactory } from '@zro/test/users/config';
import { SpreadFactory } from '@zro/test/otc/config';
import { CurrencyFactory } from '@zro/test/operations/config';

describe('GetQuotationMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let otcTaxIofName: string;
  const holidayRepository = new HolidayDatabaseRepository();

  const otcService: OtcServiceKafka = createMock<OtcServiceKafka>();
  const mockGetSpreadsByCurrencies: jest.Mock = On(otcService).get(
    method((mock) => mock.getSpreadsByUserAndCurrencies),
  );

  const redisService: RedisService = createMock<RedisService>();
  const mockGetRedisService: jest.Mock = On(redisService).get(
    method((mock) => mock.get),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(RedisService)
      .useValue(redisService)
      .compile();
    controller = module.get<Controller>(Controller);
    const configService = module.get<ConfigService>(ConfigService);
    otcTaxIofName = configService.get<string>('APP_OTC_IOF_NAME');
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetQuotation', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get quotation successfully - amount currency === base currency', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);
        const currencyBTC = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
          { decimal: 8, symbol: 'BTC' },
        );
        const currencyBRL = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
          { decimal: 2, symbol: 'BRL' },
        );
        const spread = await SpreadFactory.create<SpreadEntity>(
          SpreadEntity.name,
        );

        const streamPairData = await StreamPairFactory.create<StreamPairEntity>(
          StreamPairEntity.name,
        );
        const streamPairKey: RedisKey = {
          key: streamPairData.id,
          data: [streamPairData],
          ttl: 1,
        };

        const streamQuotationData =
          await StreamQuotationFactory.create<StreamQuotationEntity>(
            StreamQuotationEntity.name,
            {
              baseCurrency: currencyBTC,
              quoteCurrency: currencyBRL,
              composedBy: null,
            },
          );
        const streamQuotationKey: RedisKey = {
          key: currencyBTC.symbol,
          data: streamQuotationData,
          ttl: 1,
        };
        const taxData = await TaxFactory.create<TaxEntity>(TaxEntity.name, {
          name: otcTaxIofName,
          value: 38,
        });
        const taxKey: RedisKey = {
          key: currencyBTC.symbol,
          data: [taxData],
          ttl: 1,
        };

        mockGetRedisService
          .mockResolvedValueOnce(streamPairKey)
          .mockResolvedValueOnce(streamQuotationKey)
          .mockResolvedValueOnce(taxKey);
        mockGetSpreadsByCurrencies.mockResolvedValue([spread]);

        const message: GetQuotationRequest = {
          userId: user.uuid,
          amount: faker.datatype.number({ min: 1000, max: 999999 }),
          amountCurrencySymbol: currencyBRL.symbol,
          baseCurrencySymbol: currencyBTC.symbol,
          side: OrderSide.BUY,
        };

        const result = await controller.execute(
          holidayRepository,
          otcService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.price).toBeDefined();
        expect(result.value.priceBuy).toBeDefined();
        expect(result.value.priceSell).toBeDefined();
        expect(result.value.side).toBeDefined();
        expect(result.value.partialBuy).toBeDefined();
        expect(result.value.partialSell).toBeDefined();
        expect(result.value.spreadIds.length).toBe(1);
        expect(result.value.spreadIds[0]).toBe(spread.id);
        expect(result.value.spreadBuy).toBe(spread.buy);
        expect(result.value.spreadAmountBuy).toBeDefined();
        expect(result.value.spreadSell).toBe(spread.sell);
        expect(result.value.spreadAmountSell).toBeDefined();
        expect(result.value.iofAmount).toBeDefined();
        expect(result.value.iofValue).toBe(38);
        expect(result.value.quoteAmountBuy).toBeDefined();
        expect(result.value.quoteAmountSell).toBeDefined();
        expect(result.value.quoteCurrencySymbol).toBe(currencyBRL.symbol);
        expect(result.value.quoteCurrencyDecimal).toBe(currencyBRL.decimal);
        expect(result.value.quoteCurrencyTitle).toBe(currencyBRL.title);
        expect(result.value.baseAmountBuy).toBeDefined();
        expect(result.value.baseAmountSell).toBeDefined();
        expect(result.value.baseCurrencySymbol).toBe(currencyBTC.symbol);
        expect(result.value.baseCurrencyDecimal).toBe(currencyBTC.decimal);
        expect(result.value.baseCurrencyTitle).toBe(currencyBTC.title);
      });

      it('TC0002 - Should get quotation successfully - amount currency === quote currency', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);
        const currencyBTC = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
          { decimal: 8, symbol: 'BTC' },
        );
        const CurrencyUSD = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
          { decimal: 2, symbol: 'USD' },
        );
        const spread = await SpreadFactory.create<SpreadEntity>(
          SpreadEntity.name,
        );

        const streamPairData = await StreamPairFactory.create<StreamPairEntity>(
          StreamPairEntity.name,
        );
        const streamPairKey: RedisKey = {
          key: streamPairData.id,
          data: [streamPairData],
          ttl: 1,
        };
        const streamQuotationData =
          await StreamQuotationFactory.create<StreamQuotationEntity>(
            StreamQuotationEntity.name,
            { baseCurrency: currencyBTC, quoteCurrency: CurrencyUSD },
          );
        const streamQuotationKey: RedisKey = {
          key: currencyBTC.symbol,
          data: streamQuotationData,
          ttl: 1,
        };
        const taxData = await TaxFactory.create<TaxEntity>(TaxEntity.name, {
          name: otcTaxIofName,
          value: 38,
        });
        const taxKey: RedisKey = {
          key: currencyBTC.symbol,
          data: [taxData],
          ttl: 1,
        };

        mockGetRedisService
          .mockResolvedValueOnce(streamPairKey)
          .mockResolvedValueOnce(streamQuotationKey)
          .mockResolvedValueOnce(taxKey);
        mockGetSpreadsByCurrencies.mockResolvedValue([spread]);

        const message: GetQuotationRequest = {
          userId: user.uuid,
          amount: faker.datatype.number({ min: 100, max: 10000 }),
          amountCurrencySymbol: CurrencyUSD.symbol,
          baseCurrencySymbol: currencyBTC.symbol,
          side: OrderSide.BUY,
        };

        const result = await controller.execute(
          holidayRepository,
          otcService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.price).toBeDefined();
        expect(result.value.priceBuy).toBeDefined();
        expect(result.value.priceSell).toBeDefined();
        expect(result.value.side).toBeDefined();
        expect(result.value.partialBuy).toBeDefined();
        expect(result.value.partialSell).toBeDefined();
        expect(result.value.spreadIds.length).toBe(1);
        expect(result.value.spreadIds[0]).toBe(spread.id);
        expect(result.value.spreadBuy).toBe(spread.buy);
        expect(result.value.spreadAmountBuy).toBeDefined();
        expect(result.value.spreadSell).toBe(spread.sell);
        expect(result.value.spreadAmountSell).toBeDefined();
        expect(result.value.iofAmount).toBeDefined();
        expect(result.value.iofValue).toBe(38);
        expect(result.value.quoteAmountBuy).toBeDefined();
        expect(result.value.quoteAmountSell).toBeDefined();
        expect(result.value.quoteCurrencySymbol).toBe(CurrencyUSD.symbol);
        expect(result.value.quoteCurrencyDecimal).toBe(CurrencyUSD.decimal);
        expect(result.value.quoteCurrencyTitle).toBe(CurrencyUSD.title);
        expect(result.value.baseAmountBuy).toBeDefined();
        expect(result.value.baseAmountSell).toBeDefined();
        expect(result.value.baseCurrencySymbol).toBe(currencyBTC.symbol);
        expect(result.value.baseCurrencyDecimal).toBe(currencyBTC.decimal);
        expect(result.value.baseCurrencyTitle).toBe(currencyBTC.title);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
