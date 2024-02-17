// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { OccupationEntity } from '@zro/users/domain';
import { OccupationModel } from '@zro/users/infrastructure';

/**
 * Occupation factory.
 */
factory.define<OccupationModel>(OccupationModel.name, OccupationModel, () => {
  return {
    codCbo: faker.datatype.number({ min: 1, max: 99999 }),
    cbo: faker.datatype.number({ min: 1, max: 99999 }),
    name: faker.datatype.string(),
    createdAt: faker.date.recent(2),
    updatedAt: faker.date.recent(2),
  };
});

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, OccupationEntity.name);

factory.define<OccupationEntity>(
  OccupationEntity.name,
  DefaultModel,
  () => {
    return {
      codCbo: faker.datatype.number({ min: 1, max: 99999 }),
      cbo: faker.datatype.number({ min: 1, max: 99999 }),
      name: faker.datatype.string(),
      createdAt: faker.date.recent(2),
      updatedAt: faker.date.recent(2),
    };
  },
  {
    afterBuild: (model) => {
      return new OccupationEntity(model);
    },
  },
);

export const OccupationFactory = factory;
