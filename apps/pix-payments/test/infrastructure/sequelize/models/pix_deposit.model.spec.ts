import { Test, TestingModule } from '@nestjs/testing';
import { PixDepositModel } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixDepositFactory } from '@zro/test/pix-payments/config';

describe('PixDepositModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const deposit = await PixDepositFactory.create<PixDepositModel>(
      PixDepositModel.name,
    );

    expect(deposit).toBeDefined();
    expect(deposit.id).toBeDefined();
    expect(deposit.userId).toBeDefined();
    expect(deposit.operationId).toBeDefined();
    expect(deposit.endToEndId).toBeDefined();
    expect(deposit.description).toBeDefined();
    expect(deposit.txId).toBeDefined();
    expect(deposit.amount).toBeDefined();
    expect(deposit.returnedAmount).toBeDefined();
    expect(deposit.clientBankIspb).toBeDefined();
    expect(deposit.clientBankName).toBeDefined();
    expect(deposit.clientBranch).toBeDefined();
    expect(deposit.endToEndId).toBeDefined();
    expect(deposit.description).toBeDefined();
    expect(deposit.transactionTag).toBeDefined();
    expect(deposit.createdAt).toBeDefined();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
