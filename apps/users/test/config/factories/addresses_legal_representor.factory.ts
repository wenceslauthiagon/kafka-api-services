// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { AddressLegalRepresentorEntity } from '@zro/users/domain';
import { AddressLegalRepresentorModel } from '@zro/users/infrastructure';

/**
 * AddressLegalRepresentor factory.
 */
factory.define<AddressLegalRepresentorModel>(
  AddressLegalRepresentorModel.name,
  AddressLegalRepresentorModel,
  async () => {
    return {
      street: faker.address.streetAddress(),
      city: faker.address.cityName(),
      neighborhood: faker.address.cityName(),
      federativeUnit: faker.address.cityName(),
      country: faker.address.country(),
      zipCode: faker.datatype.number(9999999).toString().padStart(8, '0'),
      number: faker.datatype.number({ min: 1, max: 99999 }),
      createdAt: faker.date.recent(2),
    };
  },
);

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, AddressLegalRepresentorEntity.name);

factory.define<AddressLegalRepresentorEntity>(
  AddressLegalRepresentorEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      zipCode: faker.datatype.number(9999999).toString().padStart(8, '0'),
      street: faker.address.streetAddress(),
      number: faker.datatype.number({ min: 1, max: 99999 }),
      neighborhood: faker.address.cityName(),
      city: faker.address.cityName(),
      federativeUnit: faker.address.cityName(),
      country: faker.address.country(),
      createdAt: faker.date.recent(2),
    };
  },
  {
    afterBuild: (model) => {
      return new AddressLegalRepresentorEntity(model);
    },
  },
);

export const AddressLegalRepresentorFactory = factory;
