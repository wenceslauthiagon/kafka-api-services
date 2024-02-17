// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cnpj } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import {
  AddressLegalRepresentorEntity,
  PersonType,
  RepresentorType,
  UserEntity,
  UserLegalRepresentorEntity,
} from '@zro/users/domain';
import {
  AddressLegalRepresentorModel,
  UserLegalRepresentorModel,
  UserModel,
} from '@zro/users/infrastructure';
import {
  UserFactory,
  AddressLegalRepresentorFactory,
} from '@zro/test/users/config';

/**
 * UserLegalRepresentor model factory.
 */
factory.define<UserLegalRepresentorModel>(
  UserLegalRepresentorModel.name,
  UserLegalRepresentorModel,
  async () => {
    const user = await UserFactory.create<UserModel>(UserModel.name, {
      document: cnpj.generate(),
      type: PersonType.LEGAL_PERSON,
    });
    return {
      userId: user.uuid,
      addressId: factory.assoc(AddressLegalRepresentorModel.name, 'id'),
      personType: user.type,
      document: user.document,
      name: user.name,
      birthDate: faker.date.recent(),
      type: RepresentorType.ADMINISTRATOR,
      isPublicServer: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
    };
  },
);

/**
 * UserLegalRepresentor entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, UserLegalRepresentorEntity.name);

factory.define<UserLegalRepresentorEntity>(
  UserLegalRepresentorEntity.name,
  DefaultModel,
  async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name, {
      document: cnpj.generate(),
      type: PersonType.LEGAL_PERSON,
    });
    const address =
      await AddressLegalRepresentorFactory.create<AddressLegalRepresentorEntity>(
        AddressLegalRepresentorEntity.name,
      );

    return {
      id: faker.datatype.uuid(),
      user,
      address,
      personType: user.type,
      document: user.document,
      name: user.name,
      birthDate: faker.date.recent(),
      type: RepresentorType.ADMINISTRATOR,
      isPublicServer: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
    };
  },
  {
    afterBuild: (model) => {
      return new UserLegalRepresentorEntity(model);
    },
  },
);

export const UserLegalRepresentorFactory = factory;
