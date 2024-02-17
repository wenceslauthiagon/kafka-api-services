import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { AdminBankingAccountModel } from '@zro/banking/infrastructure';
import { AdminBankingAccountFactory } from '@zro/test/banking/config';

describe('AdminBankingAccountModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.banking.env'] }),
        DatabaseModule.forFeature([AdminBankingAccountModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const adminBankingAccount =
      await AdminBankingAccountFactory.create<AdminBankingAccountModel>(
        AdminBankingAccountModel.name,
      );

    expect(adminBankingAccount).toBeDefined();
    expect(adminBankingAccount.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
