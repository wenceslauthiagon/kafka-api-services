import { Test, TestingModule } from '@nestjs/testing';
import { WarningTransactionModel } from '@zro/compliance/infrastructure';
import { AppModule } from '@zro/compliance/infrastructure/nest/modules/app.module';
import { WarningTransactionFactory } from '@zro/test/compliance/config';

describe('WarningTransactionModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const warningTransaction =
      await WarningTransactionFactory.create<WarningTransactionModel>(
        WarningTransactionModel.name,
      );
    expect(warningTransaction).toBeDefined();
    expect(warningTransaction.id).toBeDefined();
    expect(warningTransaction.operationId).toBeDefined();
    expect(warningTransaction.transactionTag).toBeDefined();
    expect(warningTransaction.endToEndId).toBeDefined();
    expect(warningTransaction.status).toBeDefined();
    expect(warningTransaction.createdAt).toBeDefined();
  });

  afterAll(() => module.close());
});
