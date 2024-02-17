import { Test, TestingModule } from '@nestjs/testing';
import { WarningPixDepositBankBlockListModel } from '@zro/pix-payments/infrastructure';
import { WarningPixDepositBankBlockListFactory } from '@zro/test/pix-payments/config';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';

describe('WarningPixDepositBankBlockListModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const warningPixDepositBankBlockList =
      await WarningPixDepositBankBlockListFactory.create<WarningPixDepositBankBlockListModel>(
        WarningPixDepositBankBlockListModel.name,
      );

    expect(warningPixDepositBankBlockList).toBeDefined();
    expect(warningPixDepositBankBlockList.id).toBeDefined();
    expect(warningPixDepositBankBlockList.cnpj).toBeDefined();
    expect(warningPixDepositBankBlockList.name).toBeDefined();
    expect(warningPixDepositBankBlockList.description).toBeDefined();
    expect(warningPixDepositBankBlockList.createdAt).toBeDefined();
    expect(warningPixDepositBankBlockList.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
