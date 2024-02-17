import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger } from '@zro/common';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { SpreadRepository } from '@zro/otc/domain';
import {
  GetSpreadByUserAndCurrencyMicroserviceController as Controller,
  SpreadDatabaseRepository,
  SpreadModel,
} from '@zro/otc/infrastructure';
import { SpreadFactory } from '@zro/test/otc/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetSpreadByUserAndCurrencyRequest } from '@zro/otc/interface';

describe('GetSpreadByUserAndCurrencyMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let spreadRepository: SpreadRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    spreadRepository = new SpreadDatabaseRepository();
  });

  describe('GetSpreadByUserAndCurrency', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get spread by user and currency successfully', async () => {
        const spread = await SpreadFactory.create<SpreadModel>(
          SpreadModel.name,
        );

        const message: GetSpreadByUserAndCurrencyRequest = {
          currencySymbol: spread.currencySymbol,
          userId: spread.userId,
        };

        const result = await controller.execute(
          spreadRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(spread.id);
        expect(result.value.sell).toBe(spread.sell);
        expect(result.value.amount).toBe(spread.amount);
        expect(result.value.buy).toBe(spread.buy);
        expect(result.value.currencyId).toBe(spread.currencyId);
        expect(result.value.currencySymbol).toBe(spread.currencySymbol);
        expect(result.value.offMarketBuy).toBe(spread.offMarketBuy);
        expect(result.value.offMarketSell).toBe(spread.offMarketSell);
        expect(result.value.offMarketTimeStart).toBe(spread.offMarketTimeStart);
        expect(result.value.offMarketTimeEnd).toBe(spread.offMarketTimeEnd);
        expect(result.value.createdAt).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
