import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { BankTedModel } from '@zro/banking/infrastructure';
import { BankTedFactory } from '@zro/test/banking/config';

describe('BankTedModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.banking.env'] }),
        DatabaseModule.forFeature([BankTedModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be create', async () => {
    const bankTed = await BankTedFactory.create<BankTedModel>(
      BankTedModel.name,
    );
    expect(bankTed).toBeDefined();
    expect(bankTed.id).toBeDefined();
    expect(bankTed.ispb).toBeDefined();
    expect(bankTed.active).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
