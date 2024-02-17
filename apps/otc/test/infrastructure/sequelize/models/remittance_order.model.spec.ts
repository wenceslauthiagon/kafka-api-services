import { Test, TestingModule } from '@nestjs/testing';
import { RemittanceOrderModel } from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { RemittanceOrderFactory } from '@zro/test/otc/config';

describe('RemittanceOrderModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const RemittanceOrder =
      await RemittanceOrderFactory.create<RemittanceOrderModel>(
        RemittanceOrderModel.name,
      );
    expect(RemittanceOrder).toBeDefined();
    expect(RemittanceOrder.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
