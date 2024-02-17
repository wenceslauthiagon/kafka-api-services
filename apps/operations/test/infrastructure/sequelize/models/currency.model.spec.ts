import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@zro/common';
import { CurrencyState } from '@zro/operations/domain';
import { CurrencyModel } from '@zro/operations/infrastructure';
import { CurrencyFactory } from '@zro/test/operations/config';

describe('CurrencyModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.operations.env'] }),
        DatabaseModule.forFeature([CurrencyModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const currency = await CurrencyFactory.create<CurrencyModel>(
      CurrencyModel.name,
    );
    expect(currency).toBeDefined();
    expect(currency.id).toBeDefined();
  });

  it('TC0002 - should get a deactivate currency', async () => {
    const currency = await CurrencyFactory.create<CurrencyModel>(
      CurrencyModel.name,
      {
        state: CurrencyState.DEACTIVATE,
      },
    );
    expect(currency).toBeDefined();
    expect(currency.id).toBeDefined();
    expect(currency.isActive()).toBe(false);
  });

  afterAll(async () => {
    await module.close();
  });
});
