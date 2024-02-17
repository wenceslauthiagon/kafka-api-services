// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { SystemEntity } from '@zro/otc/domain';
import { SystemModel } from '@zro/otc/infrastructure';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  name: faker.datatype.string(10),
  description: faker.datatype.string(10),
  createdAt: faker.date.recent(),
});

/**
 * System factory.
 */
factory.define<SystemModel>(SystemModel.name, SystemModel, () => fakerModel());

/**
 * System entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, SystemEntity.name);

factory.define<SystemEntity>(
  SystemEntity.name,
  DefaultModel,
  () => fakerModel(),
  {
    afterBuild: (model) => {
      return new SystemEntity(model);
    },
  },
);

export const SystemFactory = factory;
