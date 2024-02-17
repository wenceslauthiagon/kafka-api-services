// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cnpj } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import { PersonType } from '@zro/users/domain';
import {
  ClaimType,
  PixKeyClaimEntity,
  ClaimStatusType,
  KeyType,
} from '@zro/pix-keys/domain';
import { PixKeyClaimModel } from '@zro/pix-keys/infrastructure';

/**
 * PixKeyClaim factory.
 */
factory.define<PixKeyClaimModel>(
  PixKeyClaimModel.name,
  PixKeyClaimModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      key: faker.datatype.uuid(),
      type: ClaimType.OWNERSHIP,
      status: ClaimStatusType.OPEN,
      ispb: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      document: cnpj.generate(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      personType: PersonType.LEGAL_PERSON,
      finalResolutionDate: faker.date.recent(),
      finalCompleteDate: faker.date.recent(),
      lastChangeDate: faker.date.recent(),
    };
  },
);

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PixKeyClaimEntity.name);

factory.define<PixKeyClaimEntity>(
  PixKeyClaimEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      key: faker.datatype.uuid(),
      type: ClaimType.OWNERSHIP,
      status: ClaimStatusType.OPEN,
      ispb: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      document: cnpj.generate(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      personType: PersonType.LEGAL_PERSON,
      finalResolutionDate: faker.date.recent(),
      finalCompleteDate: faker.date.recent(),
      lastChangeDate: faker.date.recent(),
      claimOpeningDate: faker.date.recent(),
      claimClosingDate: faker.date.recent(),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
    };
  },
  {
    afterBuild: (model) => {
      return new PixKeyClaimEntity(model);
    },
  },
);

export const PixKeyClaimFactory = factory;
