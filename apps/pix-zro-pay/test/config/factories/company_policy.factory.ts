// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';

import { DefaultModel } from '@zro/common/test';
import { CompanyPolicyModel } from '@zro/pix-zro-pay/infrastructure';
import { CompanyEntity, CompanyPolicyEntity } from '@zro/pix-zro-pay/domain';

const fakerModel = () => ({
  shouldRejectPaidByThirdPartyWhenCpf: faker.datatype.boolean(),
  shouldRejectPaidByThirdPartyWhenCnpj: faker.datatype.boolean(),
  maximumValueToStartRefundingPerClient: faker.datatype.number(),
  qrcodeExpirationTimeInSeconds: faker.datatype.number(),
  webhookVersion: faker.datatype.string(),
  verifyKycTransactions: faker.datatype.boolean(),
  sendKycTransactions: faker.datatype.boolean(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * CompanyPolicy model factory.
 */
factory.define<CompanyPolicyModel>(
  CompanyPolicyModel.name,
  CompanyPolicyModel,
  () => {
    return {
      ...fakerModel(),
      companyId: faker.datatype.number({ min: 1, max: 99999 }),
    };
  },
);

/**
 * CompanyPolicy entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, CompanyPolicyEntity.name);

factory.define<CompanyPolicyEntity>(
  CompanyPolicyEntity.name,
  DefaultModel,
  async () => {
    return {
      ...fakerModel(),
      company: new CompanyEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
      }),
    };
  },
  {
    afterBuild: (model) => {
      return new CompanyPolicyEntity(model);
    },
  },
);

export const CompanyPolicyFactory = factory;
