// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { PermissionActionEntity } from '@zro/operations/domain';
import { PermissionActionModel } from '@zro/operations/infrastructure';

/**
 * Permission Action factory.
 */
factory.define<PermissionActionModel>(
  PermissionActionModel.name,
  PermissionActionModel,
  (): Partial<PermissionActionModel> => {
    return {
      tag: faker.random.alpha({ count: 5, casing: 'upper' }),
    };
  },
);

/**
 * Permission Action entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PermissionActionEntity.name);

factory.define<PermissionActionEntity>(
  PermissionActionEntity.name,
  DefaultModel,
  async (): Promise<Partial<PermissionActionEntity>> => {
    return {
      id: faker.datatype.uuid(),
      tag: faker.random.alpha({ count: 5, casing: 'upper' }),
    };
  },
  {
    afterBuild: (model) => {
      return new PermissionActionEntity(model);
    },
  },
);

export const PermissionActionFactory = factory;
