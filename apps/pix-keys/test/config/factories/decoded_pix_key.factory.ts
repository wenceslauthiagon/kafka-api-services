// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cnpj } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import { PersonType, UserEntity } from '@zro/users/domain';
import { AccountType } from '@zro/pix-payments/domain';
import {
  KeyType,
  DecodedPixKeyEntity,
  DecodedPixKeyState,
} from '@zro/pix-keys/domain';
import { DecodedPixKeyModel } from '@zro/pix-keys/infrastructure';

const fakerModel = (): Partial<DecodedPixKeyEntity> => {
  const document = cnpj.generate();

  return {
    id: faker.datatype.uuid(),
    type: KeyType.CNPJ,
    key: document,
    personType: PersonType.LEGAL_PERSON,
    document: document,
    name: faker.datatype.string(),
    tradeName: faker.datatype.string(),
    accountNumber: faker.datatype.uuid(),
    accountType: AccountType.CACC,
    branch: faker.datatype.string(),
    ispb: faker.datatype.string(),
    activeAccount: faker.datatype.boolean(),
    accountOpeningDate: faker.date.recent(2),
    keyCreationDate: faker.date.recent(2),
    keyOwnershipDate: faker.date.recent(2),
    claimRequestDate: faker.date.recent(2),
    endToEndId: faker.datatype.string(),
    cidId: faker.datatype.string(),
    dictAccountId: faker.datatype.number({ min: 1, max: 99999 }),
    state: DecodedPixKeyState.PENDING,
    createdAt: faker.date.recent(2),
    updatedAt: faker.date.recent(2),
  };
};

/**
 * DecodedPixKey factory.
 */
factory.define<DecodedPixKeyModel>(
  DecodedPixKeyModel.name,
  DecodedPixKeyModel,
  () => ({
    ...fakerModel(),
    userId: faker.datatype.uuid(),
  }),
);

/**
 * DecodedPixKey entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, DecodedPixKeyEntity.name);

factory.define<DecodedPixKeyEntity>(
  DecodedPixKeyEntity.name,
  DefaultModel,
  () => ({
    ...fakerModel(),
    user: new UserEntity({ uuid: faker.datatype.uuid() }),
  }),
  {
    afterBuild: (model) => {
      return new DecodedPixKeyEntity(model);
    },
  },
);

export const DecodedPixKeyFactory = factory;
