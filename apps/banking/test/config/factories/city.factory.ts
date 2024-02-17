// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { CityEntity } from '@zro/banking/domain';
import { CityModel } from '@zro/banking/infrastructure';

/**
 * City factory.
 */
factory.define<CityModel>(CityModel.name, CityModel, () => {
  return {
    id: faker.datatype.uuid(),
    code: faker.datatype.number({ min: 1, max: 99999 }).toString(),
    name: faker.name.firstName(),
    federativeUnitCode: faker.datatype
      .number({ min: 1, max: 99999 })
      .toString(),
    federativeUnitName: faker.name.firstName(),
    federativeUnitAcronym: faker.name.firstName(),
    regionCode: faker.datatype.number({ min: 1, max: 99999 }).toString(),
    regionName: faker.name.firstName(),
    regionAcronym: faker.name.firstName(),
    active: true,
    createdAt: faker.date.recent(2),
  };
});

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, CityEntity.name);

factory.define<CityEntity>(
  CityEntity.name,
  DefaultModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      code: faker.datatype.number({ min: 1, max: 99999 }).toString(),
      name: faker.name.firstName(),
      federativeUnitCode: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString(),
      federativeUnitName: faker.name.firstName(),
      federativeUnitAcronym: faker.name.firstName(),
      regionCode: faker.datatype.number({ min: 1, max: 99999 }).toString(),
      regionName: faker.name.firstName(),
      regionAcronym: faker.name.firstName(),
      active: true,
      createdAt: faker.date.recent(2),
    };
  },
  {
    afterBuild: (model) => {
      return new CityEntity(model);
    },
  },
);

export const CityFactory = factory;
