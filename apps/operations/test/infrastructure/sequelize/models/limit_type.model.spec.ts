import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import {
  CurrencyModel,
  LimitTypeModel,
  TransactionTypeModel,
} from '@zro/operations/infrastructure';
import { LimitTypeFactory } from '@zro/test/operations/config';

describe('LimitTypeModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.operations.env'] }),
        DatabaseModule.forFeature([
          CurrencyModel,
          TransactionTypeModel,
          LimitTypeModel,
        ]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
    );
    expect(limitType).toBeDefined();
    expect(limitType.id).toBeDefined();
    expect(limitType.toDomain().currency).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
