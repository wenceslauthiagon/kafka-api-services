import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import {
  AdminBankingAccountModel,
  AdminBankingTedModel,
} from '@zro/banking/infrastructure';
import { AdminBankingTedFactory } from '@zro/test/banking/config';

describe('AdminBankingTedModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.banking.env'] }),
        DatabaseModule.forFeature([
          AdminBankingAccountModel,
          AdminBankingTedModel,
        ]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const adminBankingTed =
      await AdminBankingTedFactory.create<AdminBankingTedModel>(
        AdminBankingTedModel.name,
      );
    expect(adminBankingTed).toBeDefined();
    expect(adminBankingTed.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
