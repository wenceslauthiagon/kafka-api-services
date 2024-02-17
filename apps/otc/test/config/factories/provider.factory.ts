// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { ProviderEntity } from '@zro/otc/domain';
import { ProviderModel } from '@zro/otc/infrastructure';

/**
 * Provider factory.
 */
factory.define<ProviderModel>(ProviderModel.name, ProviderModel, () => {
  return {
    name: faker.datatype.string(10),
    description: faker.datatype.string(10),
  };
});

/**
 * Provider entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, ProviderEntity.name);

factory.define<ProviderEntity>(
  ProviderEntity.name,
  DefaultModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      name: faker.datatype.string(10),
      description: faker.datatype.string(10),
    };
  },
  {
    afterBuild: (model) => {
      return new ProviderEntity(model);
    },
  },
);

export const ProviderFactory = factory;
