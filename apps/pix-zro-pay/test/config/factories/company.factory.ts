// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';

import { DefaultModel } from '@zro/common/test';
import { CompanyModel } from '@zro/pix-zro-pay/infrastructure';
import {
  BankAccountEntity,
  CompanyEntity,
  PlanEntity,
  UserEntity,
} from '@zro/pix-zro-pay/domain';

const fakerModel = () => ({
  id: faker.datatype.number(),
  name: faker.datatype.string(),
  tradingName: faker.datatype.string(),
  cnpj: faker.datatype.string(),
  ie: faker.datatype.string(),
  phone: faker.datatype.string(),
  webhookTransaction: faker.datatype.string(),
  webhookWithdraw: faker.datatype.string(),
  xApiKey: faker.datatype.string(),
  identifier: faker.datatype.string(),
  isRetailer: faker.datatype.boolean(),
  requireClientDocument: faker.datatype.boolean(),
  phoneNumber: faker.datatype.string(),
  zroUserId: faker.datatype.string(),
  zroUserKey: faker.datatype.string(),
  pixKeyType: faker.datatype.string(),
  pixKey: faker.datatype.string(),
  showQrCodeInfoToPayer: faker.datatype.boolean(),
  email: faker.datatype.string(),
  webhookRefund: faker.datatype.string(),
  webhookKyc: faker.datatype.string(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * Company model factory.
 */
factory.define<CompanyModel>(CompanyModel.name, CompanyModel, () => {
  return {
    ...fakerModel(),
    planId: faker.datatype.number({ min: 1, max: 99999 }),
    responsibleId: faker.datatype.number({ min: 1, max: 99999 }),
    activeBankForCashInId: faker.datatype.number(),
    activeBankForCashOutId: faker.datatype.number(),
  };
});

/**
 * Company entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, CompanyEntity.name);

factory.define<CompanyEntity>(
  CompanyEntity.name,
  DefaultModel,
  async () => {
    return {
      ...fakerModel(),
      plan: new PlanEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
      }),
      responsible: new UserEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
      }),
      activeBankForCashIn: new BankAccountEntity({
        id: faker.datatype.number(),
      }),
      activeBankForCashOut: new BankAccountEntity({
        id: faker.datatype.number(),
      }),
    };
  },
  {
    afterBuild: (model) => {
      return new CompanyEntity(model);
    },
  },
);

export const CompanyFactory = factory;
