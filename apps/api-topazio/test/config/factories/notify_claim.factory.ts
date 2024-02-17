// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import { AccountType } from '@zro/pix-payments/domain';
import {
  KeyType,
  ClaimReasonType,
  ClaimStatusType,
  ClaimType,
} from '@zro/pix-keys/domain';
import { PersonType } from '@zro/users/domain';
import { NotifyStateType, NotifyClaimEntity } from '@zro/api-topazio/domain';
import { NotifyClaimModel } from '@zro/api-topazio/infrastructure';

/**
 * NotifyClaim factory.
 */
factory.define<NotifyClaimModel>(
  NotifyClaimModel.name,
  NotifyClaimModel,
  () => {
    return {
      externalId: faker.datatype.uuid(),
      accountOpeningDate: faker.date.recent(999),
      accountType: AccountType.CACC,
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      claimReason: ClaimReasonType.DEFAULT_OPERATION,
      claimType: ClaimType.OWNERSHIP,
      document: cpf.generate(),
      donation: faker.datatype.boolean(),
      donorIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      requestIspb: faker.datatype.uuid(),
      endCompleteDate: faker.date.recent(999),
      endResolutionDate: faker.date.recent(999),
      lastChangeDate: faker.date.recent(999),
      ispb: faker.datatype.number(99999).toString().padStart(8, '0'),
      key: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      name: faker.datatype.uuid(),
      personType: PersonType.NATURAL_PERSON,
      status: ClaimStatusType.COMPLETED,
      tradeName: null,
      state: NotifyStateType.READY,
    };
  },
);

/**
 * NotifyClaim entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, NotifyClaimEntity.name);

factory.define<NotifyClaimEntity>(
  NotifyClaimEntity.name,
  DefaultModel,
  async () => {
    return {
      externalId: faker.datatype.uuid(),
      accountOpeningDate: faker.date.recent(999),
      accountType: AccountType.CACC,
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      claimReason: ClaimReasonType.DEFAULT_OPERATION,
      claimType: ClaimType.OWNERSHIP,
      document: cpf.generate(),
      donation: faker.datatype.boolean(),
      donorIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      requestIspb: faker.datatype.uuid(),
      endCompleteDate: faker.date.recent(999),
      endResolutionDate: faker.date.recent(999),
      lastChangeDate: faker.date.recent(999),
      ispb: faker.datatype.number(99999).toString().padStart(8, '0'),
      key: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      name: faker.datatype.uuid(),
      personType: PersonType.NATURAL_PERSON,
      status: ClaimStatusType.COMPLETED,
      tradeName: null,
    };
  },
  {
    afterBuild: (model) => {
      return new NotifyClaimEntity(model);
    },
  },
);

export const NotifyClaimFactory = factory;
