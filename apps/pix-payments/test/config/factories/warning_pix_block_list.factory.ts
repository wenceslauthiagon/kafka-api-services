// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import { WarningPixBlockListEntity } from '@zro/pix-payments/domain';
import { WarningPixBlockListModel } from '@zro/pix-payments/infrastructure';

/**
 * WarningPixBlockList factory.
 */
factory.define<WarningPixBlockListModel>(
  WarningPixBlockListModel.name,
  WarningPixBlockListModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      cpf: cpf.generate(),
      description: faker.datatype.string(),
      reviewAssignee: faker.datatype.number(50),
      createdAt: faker.date.recent(99),
      updatedAt: faker.date.recent(99),
    };
  },
);

/**
 * WarningPixBlockList entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, WarningPixBlockListEntity.name);

factory.define<WarningPixBlockListEntity>(
  WarningPixBlockListEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      cpf: cpf.generate(),
      description: faker.datatype.string(),
      reviewAssignee: faker.datatype.number(50),
      createdAt: faker.date.recent(99),
      updatedAt: faker.date.recent(99),
    };
  },
  {
    afterBuild: (model) => {
      return new WarningPixBlockListEntity(model);
    },
  },
);

export const WarningPixBlockListFactory = factory;
