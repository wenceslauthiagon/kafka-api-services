import { Test, TestingModule } from '@nestjs/testing';

import { DecodedPixAccountModel } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { DecodedPixAccountFactory } from '@zro/test/pix-payments/config';

describe(DecodedPixAccountModel.name, () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const decodedAccount =
      await DecodedPixAccountFactory.create<DecodedPixAccountModel>(
        DecodedPixAccountModel.name,
      );
    expect(decodedAccount).toBeDefined();
    expect(decodedAccount.id).toBeDefined();
    expect(decodedAccount.userId).toBeDefined();
    expect(decodedAccount.props).toBeDefined();
    expect(decodedAccount.name).toBeDefined();
    expect(decodedAccount.tradeName).toBeDefined();
    expect(decodedAccount.bankIspb).toBeDefined();
    expect(decodedAccount.bankName).toBeDefined();
    expect(decodedAccount.branch).toBeDefined();
    expect(decodedAccount.accountNumber).toBeDefined();
    expect(decodedAccount.document).toBeDefined();
    expect(decodedAccount.state).toBeDefined();
    expect(decodedAccount.personType).toBeDefined();
    expect(decodedAccount.accountType).toBeDefined();
    expect(decodedAccount.createdAt).toBeDefined();
    expect(decodedAccount.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
