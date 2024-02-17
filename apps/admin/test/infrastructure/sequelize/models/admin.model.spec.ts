import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { AdminModel } from '@zro/admin/infrastructure';
import { AdminFactory } from '@zro/test/admin/config';

describe('AdminModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.admin.env'] }),
        DatabaseModule.forFeature([AdminModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const admin = await AdminFactory.create<AdminModel>(AdminModel.name);
    expect(admin).toBeDefined();
    expect(admin.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
