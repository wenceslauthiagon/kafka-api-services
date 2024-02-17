import { Test, TestingModule } from '@nestjs/testing';
import { WarningPixSkipListModel } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { WarningPixSkipListFactory } from '@zro/test/pix-payments/config';

describe('WarningPixSkipListModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const warningPixSkipList =
      await WarningPixSkipListFactory.create<WarningPixSkipListModel>(
        WarningPixSkipListModel.name,
      );

    expect(warningPixSkipList).toBeDefined();
    expect(warningPixSkipList.id).toBeDefined();
    expect(warningPixSkipList.userId).toBeDefined();
    expect(warningPixSkipList.clientAccountNumber).toBeDefined();
    expect(warningPixSkipList.description).toBeDefined();
    expect(warningPixSkipList.createdAt).toBeDefined();
    expect(warningPixSkipList.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
