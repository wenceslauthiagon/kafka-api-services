import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import {
  PermissionActionModel,
  PermissionTypeActionModel,
  PermissionTypeModel,
} from '@zro/operations/infrastructure';
import { PermissionActionFactory } from '@zro/test/operations/config';

describe('PermissionActionModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.operations.env'] }),
        DatabaseModule.forFeature([
          PermissionTypeModel,
          PermissionActionModel,
          PermissionTypeActionModel,
        ]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const permission =
      await PermissionActionFactory.create<PermissionActionModel>(
        PermissionActionModel.name,
      );

    expect(permission).toBeDefined();
    expect(permission.id).toBeDefined();
    expect(permission.tag).toBeDefined();
    expect(permission.description).toBeDefined();
    expect(permission.permissionTypeActions).toBeUndefined();
    expect(permission.createdAt).toBeDefined();
    expect(permission.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
