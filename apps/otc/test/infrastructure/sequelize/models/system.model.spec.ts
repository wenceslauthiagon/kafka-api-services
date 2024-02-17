import { Test, TestingModule } from '@nestjs/testing';
import { SystemModel } from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { SystemFactory } from '@zro/test/otc/config';

describe('SystemModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const system = await SystemFactory.create<SystemModel>(SystemModel.name);
    expect(system).toBeDefined();
    expect(system.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
