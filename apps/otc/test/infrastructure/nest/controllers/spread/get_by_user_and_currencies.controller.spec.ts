import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger } from '@zro/common/test';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { SpreadRepository } from '@zro/otc/domain';
import {
  GetSpreadsByUserAndCurrenciesMicroserviceController as Controller,
  SpreadDatabaseRepository,
  SpreadModel,
} from '@zro/otc/infrastructure';
import { SpreadFactory } from '@zro/test/otc/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetSpreadsByUserAndCurrenciesRequest } from '@zro/otc/interface';

describe('GetSpreadsByUserAndCurrenciesMicroserviceController', () => {
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

        const message: GetSpreadsByUserAndCurrenciesRequest = {
          currencySymbols: [spread.currencySymbol],
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

        const [res] = result.value;
        expect(res.id).toBe(spread.id);
        expect(res.sell).toBe(spread.sell);
        expect(res.amount).toBe(spread.amount);
        expect(res.buy).toBe(spread.buy);
        expect(res.currencyId).toBe(spread.currencyId);
        expect(res.currencySymbol).toBe(spread.currencySymbol);
        expect(res.offMarketBuy).toBe(spread.offMarketBuy);
        expect(res.offMarketSell).toBe(spread.offMarketSell);
        expect(res.offMarketTimeStart).toBe(spread.offMarketTimeStart);
        expect(res.offMarketTimeEnd).toBe(spread.offMarketTimeEnd);
        expect(res.createdAt).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
