// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { AddressEntity, UserEntity } from '@zro/users/domain';
import { AddressModel, UserModel } from '@zro/users/infrastructure';
import { UserFactory } from './users.factory';

/**
 * Address factory.
 */
factory.define<AddressModel>(AddressModel.name, AddressModel, () => {
  return {
    userId: factory.assoc(UserModel.name, 'id'),
    street: faker.address.streetAddress(),
    city: faker.address.cityName(),
    neighborhood: faker.address.cityName(),
    federativeUnit: faker.address.cityName(),
    country: faker.address.country(),
    zipCode: faker.datatype.number(9999999).toString().padStart(8, '0'),
    number: faker.datatype.number({ min: 1, max: 99999 }),
    createdAt: faker.date.recent(2),
  };
});

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, AddressEntity.name);

factory.define<AddressEntity>(
  AddressEntity.name,
  DefaultModel,
  async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    return {
      id: faker.datatype.number({ min: 1, max: 99999 }),
      user,
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
  {
    afterBuild: (model) => {
      return new AddressEntity(model);
    },
  },
);

export const AddressFactory = factory;
