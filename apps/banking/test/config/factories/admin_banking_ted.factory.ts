// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  AdminBankingAccountEntity,
  AdminBankingTedEntity,
  AdminBankingTedState,
} from '@zro/banking/domain';
import { AdminEntity } from '@zro/admin/domain';
import {
  AdminBankingAccountModel,
  AdminBankingTedModel,
} from '@zro/banking/infrastructure';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  state: AdminBankingTedState.PENDING,
  description: faker.datatype.string(10),
  value: faker.datatype.number({ min: 1, max: 999999 }),
  transactionId: faker.datatype.uuid(),
  createdAt: new Date(),
  updatedAt: new Date(),
});

/**
 * AdminBankingTed factory.
 */
factory.define<AdminBankingTedModel>(
  AdminBankingTedModel.name,
  AdminBankingTedModel,
  () => ({
    ...fakerModel(),
    sourceId: factory.assoc(AdminBankingAccountModel.name, 'id'),
    destinationId: factory.assoc(AdminBankingAccountModel.name, 'id'),
    createdBy: faker.datatype.number({ min: 1, max: 99 }),
    updatedBy: faker.datatype.number({ min: 1, max: 99 }),
  }),
);

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, AdminBankingTedEntity.name);

factory.define<AdminBankingTedEntity>(
  AdminBankingTedEntity.name,
  DefaultModel,
  () => ({
    ...fakerModel(),
    source: new AdminBankingAccountEntity({
      id: faker.datatype.uuid(),
    }),
    destination: new AdminBankingAccountEntity({
      id: faker.datatype.uuid(),
    }),
    createdByAdmin: new AdminEntity({
      id: faker.datatype.number({ min: 1, max: 99 }),
    }),
    updatedByAdmin: new AdminEntity({
      id: faker.datatype.number({ min: 1, max: 99 }),
    }),
  }),
  {
    afterBuild: (model) => {
      return new AdminBankingTedEntity(model);
    },
  },
);

export const AdminBankingTedFactory = factory;
