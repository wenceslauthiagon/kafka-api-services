// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { PermissionTypeEntity } from '@zro/operations/domain';
import { PermissionTypeModel } from '@zro/operations/infrastructure';

/**
 * Permission Type factory.
 */
factory.define<PermissionTypeModel>(
  PermissionTypeModel.name,
  PermissionTypeModel,
  (): Partial<PermissionTypeModel> => {
    return {
      tag: faker.random.alpha({ count: 5, casing: 'upper' }),
    };
  },
);

/**
 * Permission Type entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PermissionTypeEntity.name);

factory.define<PermissionTypeEntity>(
  PermissionTypeEntity.name,
  DefaultModel,
  async (): Promise<Partial<PermissionTypeEntity>> => {
    return {
      id: faker.datatype.uuid(),
      tag: faker.random.alpha({ count: 5, casing: 'upper' }),
    };
  },
  {
    afterBuild: (model) => {
      return new PermissionTypeEntity(model);
    },
  },
);

export const PermissionTypeFactory = factory;
