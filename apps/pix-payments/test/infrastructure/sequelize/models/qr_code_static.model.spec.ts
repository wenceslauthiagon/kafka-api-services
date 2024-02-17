import { Test, TestingModule } from '@nestjs/testing';

import { QrCodeStaticModel } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { QrCodeStaticFactory } from '@zro/test/pix-payments/config';

describe('QrCodeStaticModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const qrCodeStatic = await QrCodeStaticFactory.create<QrCodeStaticModel>(
      QrCodeStaticModel.name,
    );
    expect(qrCodeStatic).toBeDefined();
    expect(qrCodeStatic.id).toBeDefined();
    expect(qrCodeStatic.key).toBeDefined();
    expect(qrCodeStatic.keyId).toBeDefined();
    expect(qrCodeStatic.keyType).toBeDefined();
    expect(qrCodeStatic.recipientCity).toBeDefined();
    expect(qrCodeStatic.recipientName).toBeDefined();
    expect(qrCodeStatic.userId).toBeDefined();
    expect(qrCodeStatic.ispbWithdrawal).toBeDefined();
    expect(qrCodeStatic.expirationDate).toBeDefined();
    expect(qrCodeStatic.payableManyTimes).toBeDefined();
    expect(qrCodeStatic.createdAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
