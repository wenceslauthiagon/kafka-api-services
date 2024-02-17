import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { CurrencyRepository } from '@zro/operations/domain';
import {
  CurrencyModel,
  GetCurrencyBySymbolMicroserviceController as Controller,
  CurrencyDatabaseRepository,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { CurrencyFactory } from '@zro/test/operations/config';
import { CurrencyNotFoundException } from '@zro/operations/application';
import { KafkaContext } from '@nestjs/microservices';
import { GetCurrencyBySymbolRequest } from '@zro/operations/interface';

describe('GetCurrencyBySymbolMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let currencyRepository: CurrencyRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    currencyRepository = new CurrencyDatabaseRepository();
  });

  describe('GetCurrencyBySymbol', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get currency by name successfully', async () => {
        const currency = await CurrencyFactory.create<CurrencyModel>(
          CurrencyModel.name,
        );

        const message: GetCurrencyBySymbolRequest = {
          symbol: currency.symbol,
        };

        const result = await controller.execute(
          currencyRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.symbol).toBe(currency.symbol);
      });

      it('TC0002 - Should not get currency with incorrect name', async () => {
        const symbol = uuidV4();

        const message: GetCurrencyBySymbolRequest = {
          symbol,
        };

        const testScript = () =>
          controller.execute(currencyRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(CurrencyNotFoundException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
