import { Test, TestingModule } from '@nestjs/testing';
import { WarningPixBlockListModel } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { WarningPixBlockListFactory } from '@zro/test/pix-payments/config';

describe('WarningPixBlockListModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const warningPixBlockList =
      await WarningPixBlockListFactory.create<WarningPixBlockListModel>(
        WarningPixBlockListModel.name,
      );

    expect(warningPixBlockList).toBeDefined();
    expect(warningPixBlockList.id).toBeDefined();
    expect(warningPixBlockList.cpf).toBeDefined();
    expect(warningPixBlockList.description).toBeDefined();
    expect(warningPixBlockList.reviewAssignee).toBeDefined();
    expect(warningPixBlockList.createdAt).toBeDefined();
    expect(warningPixBlockList.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
