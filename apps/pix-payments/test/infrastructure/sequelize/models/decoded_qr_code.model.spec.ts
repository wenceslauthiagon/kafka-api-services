import { Test, TestingModule } from '@nestjs/testing';

import { DecodedQrCodeModel } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { DecodedQrCodeFactory } from '@zro/test/pix-payments/config';

describe('DecodedQrCodeModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const decodedQrCode = await DecodedQrCodeFactory.create<DecodedQrCodeModel>(
      DecodedQrCodeModel.name,
    );

    expect(decodedQrCode).toBeDefined();
    expect(decodedQrCode.id).toBeDefined();
    expect(decodedQrCode.documentValue).toBeDefined();
    expect(decodedQrCode.paymentValue).toBeDefined();
    expect(decodedQrCode.interestValue).toBeDefined();
    expect(decodedQrCode.fineValue).toBeDefined();
    expect(decodedQrCode.discountValue).toBeDefined();
    expect(decodedQrCode.deductionValue).toBeDefined();
    expect(decodedQrCode.emv).toBeDefined();
    expect(decodedQrCode.document).toBeDefined();
    expect(decodedQrCode.cityCode).toBeDefined();
    expect(decodedQrCode.paymentDate).toBeDefined();
    expect(decodedQrCode.key).toBeDefined();
    expect(decodedQrCode.txId).toBeDefined();
    expect(decodedQrCode.additionalInfo).toBeDefined();
    expect(decodedQrCode.recipientName).toBeDefined();
    expect(decodedQrCode.recipientPersonType).toBeDefined();
    expect(decodedQrCode.recipientDocument).toBeDefined();
    expect(decodedQrCode.recipientIspb).toBeDefined();
    expect(decodedQrCode.recipientBranch).toBeDefined();
    expect(decodedQrCode.recipientAccountType).toBeDefined();
    expect(decodedQrCode.recipientAccountNumber).toBeDefined();
    expect(decodedQrCode.recipientCity).toBeDefined();
    expect(decodedQrCode.endToEndId).toBeDefined();
    expect(decodedQrCode.type).toBeDefined();
    expect(decodedQrCode.allowUpdate).toBeDefined();
    expect(decodedQrCode.pss).toBeDefined();
    expect(decodedQrCode.agentIspbWithdrawal).toBeDefined();
    expect(decodedQrCode.agentModWithdrawal).toBeDefined();
    expect(decodedQrCode.agentIspbChange).toBeDefined();
    expect(decodedQrCode.agentModChange).toBeDefined();
    expect(decodedQrCode.expirationDate).toBeDefined();
    expect(decodedQrCode.payerPersonType).toBeDefined();
    expect(decodedQrCode.payerDocument).toBeDefined();
    expect(decodedQrCode.payerName).toBeDefined();
    expect(decodedQrCode.status).toBeDefined();
    expect(decodedQrCode.version).toBeDefined();
    expect(decodedQrCode.additionalInfos).toBeDefined();
    expect(decodedQrCode.withdrawValue).toBeDefined();
    expect(decodedQrCode.changeValue).toBeDefined();
    expect(decodedQrCode.dueDate).toBeDefined();
    expect(decodedQrCode.state).toBeDefined();
    expect(decodedQrCode.userId).toBeDefined();
    expect(decodedQrCode.recipientBankName).toBeDefined();
    expect(decodedQrCode.recipientBankIspb).toBeDefined();
    expect(decodedQrCode.createdAt).toBeDefined();
    expect(decodedQrCode.updatedAt).toBeDefined();
    expect(decodedQrCode.deletedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
