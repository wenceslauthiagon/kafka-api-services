import { Test, TestingModule } from '@nestjs/testing';

import { ProviderModel } from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ProviderFactory } from '@zro/test/otc/config';

describe('ProviderModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const Provider = await ProviderFactory.create<ProviderModel>(
      ProviderModel.name,
    );
    expect(Provider).toBeDefined();
    expect(Provider.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
