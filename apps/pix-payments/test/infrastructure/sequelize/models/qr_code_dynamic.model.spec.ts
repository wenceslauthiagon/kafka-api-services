import { Test, TestingModule } from '@nestjs/testing';

import { QrCodeDynamicModel } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { QrCodeDynamicFactory } from '@zro/test/pix-payments/config';

describe('QrCodeDynamicModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const qrCodeDynamic = await QrCodeDynamicFactory.create<QrCodeDynamicModel>(
      QrCodeDynamicModel.name,
    );
    expect(qrCodeDynamic).toBeDefined();
    expect(qrCodeDynamic.id).toBeDefined();
    expect(qrCodeDynamic.keyId).toBeDefined();
    expect(qrCodeDynamic.userId).toBeDefined();
    expect(qrCodeDynamic.description).toBeDefined();
    expect(qrCodeDynamic.expirationDate).toBeDefined();
    expect(qrCodeDynamic.createdAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
