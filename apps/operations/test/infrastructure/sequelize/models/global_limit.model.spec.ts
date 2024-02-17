import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import {
  CurrencyModel,
  GlobalLimitModel,
  LimitTypeModel,
  TransactionTypeModel,
} from '@zro/operations/infrastructure';
import { GlobalLimitFactory } from '@zro/test/operations/config';

describe('GlobalLimitModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.operations.env'] }),
        DatabaseModule.forFeature([
          CurrencyModel,
          TransactionTypeModel,
          LimitTypeModel,
          GlobalLimitModel,
        ]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const currency = await GlobalLimitFactory.create<GlobalLimitModel>(
      GlobalLimitModel.name,
    );
    expect(currency).toBeDefined();
    expect(currency.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
