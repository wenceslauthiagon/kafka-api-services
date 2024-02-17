// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { OperationsIndexEntity } from '@zro/operations/domain';

/**
 * OperationsIndex entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, OperationsIndexEntity.name);

factory.define<OperationsIndexEntity>(
  OperationsIndexEntity.name,
  DefaultModel,
  async () => {
    return {
      schemaName: faker.random.word(),
      tableName: faker.database.column(),
      indexName: faker.random.word(),
      indexDef: faker.random.words(5),
    };
  },
  {
    afterBuild: (model) => {
      return new OperationsIndexEntity(model);
    },
  },
);

export const OperationsIndexFactory = factory;
