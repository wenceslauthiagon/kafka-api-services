import { Test, TestingModule } from '@nestjs/testing';
import { WarningPixDepositModel } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { WarningPixDepositFactory } from '@zro/test/pix-payments/config';

describe('WarningPixDeposit', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const warningPixDeposit =
      await WarningPixDepositFactory.create<WarningPixDepositModel>(
        WarningPixDepositModel.name,
      );
    expect(warningPixDeposit).toBeDefined();
    expect(warningPixDeposit.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
