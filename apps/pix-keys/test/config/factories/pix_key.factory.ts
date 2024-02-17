// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import { KeyType, KeyState, PixKeyEntity } from '@zro/pix-keys/domain';
import { UserEntity, PersonType } from '@zro/users/domain';
import { PixKeyModel } from '@zro/pix-keys/infrastructure';

/**
 * PixKey factory.
 */
factory.define<PixKeyModel>(PixKeyModel.name, PixKeyModel, () => {
  return {
    id: faker.datatype.uuid(),
    type: KeyType.EVP,
    key: faker.datatype.uuid(),
    personType: PersonType.NATURAL_PERSON,
    phoneNumber: `55${faker.datatype
      .number(9999999999)
      .toString()
      .padStart(11, '0')}`,
    document: cpf.generate(),
    name: faker.name.firstName(),
    userId: faker.datatype.uuid(),
    accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
    branch: faker.datatype.number(9999).toString().padStart(4, '0'),
    state: KeyState.PENDING,
    accountOpeningDate: faker.date.recent(999),
    code: faker.datatype.number(99999).toString().padStart(5, '0'),
    createdAt: faker.date.recent(2),
  };
});

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PixKeyEntity.name);

factory.define<PixKeyEntity>(
  PixKeyEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      type: KeyType.EVP,
      key: faker.datatype.uuid(),
      personType: PersonType.NATURAL_PERSON,
      phoneNumber: `55${faker.datatype
        .number(9999999999)
        .toString()
        .padStart(11, '0')}`,
      document: cpf.generate(),
      name: faker.name.firstName(),
      user: new UserEntity({ uuid: faker.datatype.uuid() }),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      state: KeyState.PENDING,
      accountOpeningDate: faker.date.recent(999),
      code: faker.datatype.number(99999).toString().padStart(5, '0'),
      createdAt: faker.date.recent(2),
    };
  },
  {
    afterBuild: (model) => {
      return new PixKeyEntity(model);
    },
  },
);

export const PixKeyFactory = factory;
