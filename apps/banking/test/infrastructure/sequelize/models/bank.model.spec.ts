import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { BankModel } from '@zro/banking/infrastructure';
import { BankFactory } from '@zro/test/banking/config';

describe('BankModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.banking.env'] }),
        DatabaseModule.forFeature([BankModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be create', async () => {
    const bank = await BankFactory.create<BankModel>(BankModel.name);
    expect(bank).toBeDefined();
    expect(bank.id).toBeDefined();
    expect(bank.ispb).toBeDefined();
    expect(bank.active).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
