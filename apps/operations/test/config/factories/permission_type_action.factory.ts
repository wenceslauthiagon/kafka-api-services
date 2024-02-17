// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { v4 as uuidV4 } from 'uuid';
import { DefaultModel } from '@zro/common/test';
import {
  PermissionActionEntity,
  PermissionTypeActionEntity,
  PermissionTypeEntity,
} from '@zro/operations/domain';
import {
  PermissionActionModel,
  PermissionTypeActionModel,
  PermissionTypeModel,
} from '@zro/operations/infrastructure';
import {
  PermissionTypeFactory,
  PermissionActionFactory,
} from '@zro/test/operations/config';

/**
 * Permission Type Action factory.
 */
factory.define<PermissionTypeActionModel>(
  PermissionTypeActionModel.name,
  PermissionTypeActionModel,
  (): Partial<PermissionTypeActionModel> => {
    return {
      permissionActionTag: factory.assoc(PermissionActionModel.name, 'tag'),
      permissionTypeTag: factory.assoc(PermissionTypeModel.name, 'tag'),
    };
  },
);

/**
 * Permission Type entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PermissionTypeActionEntity.name);

factory.define<PermissionTypeActionEntity>(
  PermissionTypeActionEntity.name,
  DefaultModel,
  async (): Promise<Partial<PermissionTypeActionEntity>> => {
    return {
      id: uuidV4(),
      permissionAction:
        await PermissionActionFactory.create<PermissionActionEntity>(
          PermissionActionEntity.name,
        ),
      permissionType: await PermissionTypeFactory.create<PermissionTypeEntity>(
        PermissionTypeEntity.name,
      ),
    };
  },
  {
    afterBuild: (model) => {
      return new PermissionTypeActionEntity(model);
    },
  },
);

export const PermissionTypeActionFactory = factory;
