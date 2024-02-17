import { Mutex } from 'redis-semaphore';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from '@zro/common';
import {
  CryptoOrderState,
  CryptoRemittanceStatus,
  OrderType,
} from '@zro/otc/domain';
import { StreamQuotationEntity } from '@zro/quotations/domain';
import { CurrencyEntity, CurrencyType } from '@zro/operations/domain';
import {
  CryptoRemittanceGateway,
  OfflineCryptoRemittanceGatewayException,
} from '@zro/otc/application';
import {
  SyncMarketPendingCryptoOrdersCronService as Cron,
  CryptoOrderModel,
  ProviderModel,
} from '@zro/otc/infrastructure';
import { B2C2CryptoRemittanceService } from '@zro/b2c2';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { StreamQuotationFactory } from '@zro/test/quotations/config';
import { CurrencyFactory } from '@zro/test/operations/config';
import { CryptoOrderFactory, ProviderFactory } from '@zro/test/otc/config';

jest.mock('redis-semaphore');
jest.mock('ioredis');

describe('SyncMarketPendingCryptoOrdersCronService', () => {
  let module: TestingModule;
  let controller: Cron;

  const kafkaService: KafkaService = createMock<KafkaService>();
  const mockSendKafkaService: jest.Mock = On(kafkaService).get(
    method((mock) => mock.send),
  );

  const cryptoRemittanceGateway: CryptoRemittanceGateway =
    createMock<CryptoRemittanceGateway>();
  const mockGetProviderNameGateway: jest.Mock = On(cryptoRemittanceGateway).get(
    method((mock) => mock.getProviderName),
  );
  const mockGetCryptoMarketByBaseAndQuoteGateway: jest.Mock = On(
    cryptoRemittanceGateway,
  ).get(method((mock) => mock.getCryptoMarketByBaseAndQuote));
  const mockCreateCryptoRemittanceGateway: jest.Mock = On(
    cryptoRemittanceGateway,
  ).get(method((mock) => mock.createCryptoRemittance));

  const b2c2CryptoRemittanceGateway: B2C2CryptoRemittanceService =
    createMock<B2C2CryptoRemittanceService>();
  const mockGetCryptoRemittanceGateway: jest.Mock = On(
    b2c2CryptoRemittanceGateway,
  ).get(method((mock) => mock.getB2C2CryptoRemittanceGateway));

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .overrideProvider(B2C2CryptoRemittanceService)
      .useValue(b2c2CryptoRemittanceGateway)
      .compile();
    controller = module.get<Cron>(Cron);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);
  });

  describe('Sync', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should execute successfully', async () => {
        const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
          { type: CurrencyType.CRYPTO },
        );
        const streamQuotation =
          await StreamQuotationFactory.create<StreamQuotationEntity>(
            StreamQuotationEntity.name,
            { baseCurrency, quoteCurrency: baseCurrency, composedBy: null },
          );
        const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderModel>(
          CryptoOrderModel.name,
          {
            baseCurrencyId: baseCurrency.id,
            state: CryptoOrderState.PENDING,
            type: OrderType.MARKET,
          },
        );
        await ProviderFactory.create<ProviderModel>(ProviderModel.name, {
          name: streamQuotation.gatewayName,
        });

        mockGetCryptoRemittanceGateway.mockReturnValue(cryptoRemittanceGateway);
        mockSendKafkaService.mockResolvedValueOnce(streamQuotation);
        mockGetProviderNameGateway.mockReturnValue(streamQuotation.gatewayName);
        mockGetCryptoMarketByBaseAndQuoteGateway.mockResolvedValue({
          name: streamQuotation.gatewayName,
        });
        mockCreateCryptoRemittanceGateway.mockResolvedValue({
          status: CryptoRemittanceStatus.PENDING,
          executedQuantity: cryptoOrder.amount,
        });

        await controller.onModuleInit();
        await controller.execute(streamQuotation.baseCurrency);

        expect(mockSendKafkaService).toHaveBeenCalledTimes(1);
        expect(mockGetCryptoRemittanceGateway).toHaveBeenCalledTimes(1);
        expect(mockGetProviderNameGateway).toHaveBeenCalledTimes(2);
        expect(mockGetCryptoMarketByBaseAndQuoteGateway).toHaveBeenCalledTimes(
          1,
        );
        expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not execute with offline create crypto gateway ERROR', async () => {
        const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
          { type: CurrencyType.CRYPTO },
        );
        const streamQuotation =
          await StreamQuotationFactory.create<StreamQuotationEntity>(
            StreamQuotationEntity.name,
            { baseCurrency, quoteCurrency: baseCurrency, composedBy: null },
          );
        await CryptoOrderFactory.create<CryptoOrderModel>(
          CryptoOrderModel.name,
          {
            baseCurrencyId: baseCurrency.id,
            state: CryptoOrderState.PENDING,
            type: OrderType.MARKET,
          },
        );
        await ProviderFactory.create<ProviderModel>(ProviderModel.name, {
          name: streamQuotation.gatewayName,
        });

        mockGetCryptoRemittanceGateway.mockReturnValue(cryptoRemittanceGateway);
        mockSendKafkaService.mockResolvedValueOnce(streamQuotation);
        mockGetProviderNameGateway.mockReturnValue(streamQuotation.gatewayName);
        mockGetCryptoMarketByBaseAndQuoteGateway.mockResolvedValue({
          name: streamQuotation.gatewayName,
        });
        mockCreateCryptoRemittanceGateway.mockRejectedValue(
          new OfflineCryptoRemittanceGatewayException(new Error()),
        );

        await controller.onModuleInit();
        const testScript = () =>
          controller.execute(streamQuotation.baseCurrency);

        await expect(testScript).rejects.toThrow(
          OfflineCryptoRemittanceGatewayException,
        );
        expect(mockSendKafkaService).toHaveBeenCalledTimes(1);
        expect(mockGetCryptoRemittanceGateway).toHaveBeenCalledTimes(1);
        expect(mockGetProviderNameGateway).toHaveBeenCalledTimes(2);
        expect(mockGetCryptoMarketByBaseAndQuoteGateway).toHaveBeenCalledTimes(
          1,
        );
        expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
