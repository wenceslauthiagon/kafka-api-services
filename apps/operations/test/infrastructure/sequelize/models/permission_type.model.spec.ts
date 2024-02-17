import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { PermissionTypeModel } from '@zro/operations/infrastructure';
import { PermissionTypeFactory } from '@zro/test/operations/config';

describe('PermissionTypeModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.operations.env'] }),
        DatabaseModule.forFeature([PermissionTypeModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const permission = await PermissionTypeFactory.create<PermissionTypeModel>(
      PermissionTypeModel.name,
    );

    expect(permission).toBeDefined();
    expect(permission.id).toBeDefined();
    expect(permission.tag).toBeDefined();
    expect(permission.description).toBeDefined();
    expect(permission.createdAt).toBeDefined();
    expect(permission.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
