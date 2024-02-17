import { Test, TestingModule } from '@nestjs/testing';
import { BotOtcOrderModel } from '@zro/otc-bot/infrastructure';
import { AppModule } from '@zro/otc-bot/infrastructure/nest/modules/app.module';
import { BotOtcOrderFactory } from '@zro/test/otc-bot/config';

describe('BotOtcOrder', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const BotOtcOrder = await BotOtcOrderFactory.create<BotOtcOrderModel>(
      BotOtcOrderModel.name,
    );
    expect(BotOtcOrder).toBeDefined();
    expect(BotOtcOrder.id).toBeDefined();
    expect(BotOtcOrder.baseCurrencyId).toBeDefined();
    expect(BotOtcOrder.baseCurrencySymbol).toBeDefined();
    expect(BotOtcOrder.baseCurrencyDecimal).toBeDefined();
    expect(BotOtcOrder.baseCurrencyType).toBeDefined();
    expect(BotOtcOrder.sellPriceSignificantDigits).toBeDefined();
    expect(BotOtcOrder.marketName).toBeDefined();
    expect(BotOtcOrder.market).toBeDefined();
    expect(BotOtcOrder.quoteCurrencyId).toBeDefined();
    expect(BotOtcOrder.quoteCurrencySymbol).toBeDefined();
    expect(BotOtcOrder.quoteCurrencyDecimal).toBeDefined();
    expect(BotOtcOrder.quoteCurrencyType).toBeDefined();
    expect(BotOtcOrder.sellProviderId).toBeDefined();
    expect(BotOtcOrder.buyProviderId).toBeDefined();
    expect(BotOtcOrder.sellOrderId).toBeDefined();
    expect(BotOtcOrder.buyOrderId).toBeDefined();
    expect(BotOtcOrder.botOtcId).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
