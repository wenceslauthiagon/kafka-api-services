import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import {
  BankingAccountContactModel,
  BankingContactModel,
} from '@zro/banking/infrastructure';
import { BankingAccountContactFactory } from '@zro/test/banking/config';

describe('BankingAccountContactModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.banking.env'] }),
        DatabaseModule.forFeature([
          BankingContactModel,
          BankingAccountContactModel,
        ]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const contact =
      await BankingAccountContactFactory.create<BankingAccountContactModel>(
        BankingAccountContactModel.name,
      );
    expect(contact).toBeDefined();
    expect(contact.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
