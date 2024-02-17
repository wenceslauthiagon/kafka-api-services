import { Test, TestingModule } from '@nestjs/testing';
import { PaymentModel } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PaymentFactory } from '@zro/test/pix-payments/config';

describe('PaymentModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const payment = await PaymentFactory.create<PaymentModel>(
      PaymentModel.name,
    );

    expect(payment).toBeDefined();
    expect(payment.id).toBeDefined();
    expect(payment.beneficiaryAccountType).toBeDefined();
    expect(payment.beneficiaryPersonType).toBeDefined();
    expect(payment.beneficiaryBranch).toBeDefined();
    expect(payment.state).toBeDefined();
    expect(payment.beneficiaryAccountNumber).toBeDefined();
    expect(payment.beneficiaryBankName).toBeDefined();
    expect(payment.beneficiaryBankIspb).toBeDefined();
    expect(payment.beneficiaryDocument).toBeDefined();
    expect(payment.beneficiaryName).toBeDefined();
    expect(payment.value).toBeDefined();
    expect(payment.endToEndId).toBeDefined();
    expect(payment.paymentDate).toBeDefined();
    expect(payment.description).toBeDefined();
    expect(payment.userId).toBeDefined();
    expect(payment.createdAt).toBeDefined();
    expect(payment.ownerAccountNumber).toBeDefined();
    expect(payment.ownerBranch).toBeDefined();
    expect(payment.ownerDocument).toBeDefined();
    expect(payment.ownerFullName).toBeDefined();
    expect(payment.transactionTag).toBeDefined();
    expect(payment.paymentType).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
