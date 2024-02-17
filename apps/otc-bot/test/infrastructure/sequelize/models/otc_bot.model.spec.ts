import { Test, TestingModule } from '@nestjs/testing';
import { BotOtcModel } from '@zro/otc-bot/infrastructure';
import { AppModule } from '@zro/otc-bot/infrastructure/nest/modules/app.module';
import { BotOtcFactory } from '@zro/test/otc-bot/config';

describe('BotOtc', () => {
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
    const BotOtc = await BotOtcFactory.create<BotOtcModel>(BotOtcModel.name);
    expect(BotOtc).toBeDefined();
    expect(BotOtc.id).toBeDefined();
    expect(BotOtc.fromPairId).toBeDefined();
    expect(BotOtc.toPairId).toBeDefined();
    expect(BotOtc.fromProviderId).toBeDefined();
    expect(BotOtc.toProviderId).toBeDefined();
    expect(BotOtc.name).toBeDefined();
    expect(BotOtc.balance).toBeDefined();
    expect(BotOtc.step).toBeDefined();
    expect(BotOtc.control).toBeDefined();
    expect(BotOtc.status).toBeDefined();
    expect(BotOtc.type).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
