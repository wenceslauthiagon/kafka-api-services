import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { TransactionTypeModel } from '@zro/operations/infrastructure';
import { TransactionTypeFactory } from '@zro/test/operations/config';
import { TransactionTypeState } from '@zro/operations/domain';

describe('TransactionTypeModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.operations.env'] }),
        DatabaseModule.forFeature([TransactionTypeModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const currency = await TransactionTypeFactory.create<TransactionTypeModel>(
      TransactionTypeModel.name,
    );
    expect(currency).toBeDefined();
    expect(currency.id).toBeDefined();
  });

  it('TC0002 - should get a deactivate currency', async () => {
    const currency = await TransactionTypeFactory.create<TransactionTypeModel>(
      TransactionTypeModel.name,
      {
        state: TransactionTypeState.DEACTIVATE,
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
