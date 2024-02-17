// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { UserEntity } from '@zro/users/domain';
import { WarningPixSkipListEntity } from '@zro/pix-payments/domain';
import { WarningPixSkipListModel } from '@zro/pix-payments/infrastructure';

/**
 * WarningPixSkipList factory.
 */
factory.define<WarningPixSkipListModel>(
  WarningPixSkipListModel.name,
  WarningPixSkipListModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      userId: faker.datatype.uuid(),
      clientAccountNumber: faker.datatype.uuid(),
      description: faker.datatype.string(),
      createdAt: faker.date.recent(99),
      updatedAt: faker.date.recent(99),
    };
  },
);

/**
 * WarningPixSkipList entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, WarningPixSkipListEntity.name);

factory.define<WarningPixSkipListEntity>(
  WarningPixSkipListEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      user: new UserEntity({ uuid: faker.datatype.uuid() }),
      clientAccountNumber: faker.datatype.string(),
      description: faker.datatype.string(),
      createdAt: faker.date.recent(99),
      updatedAt: faker.date.recent(99),
    };
  },
  {
    afterBuild: (model) => {
      return new WarningPixSkipListEntity(model);
    },
  },
);

export const WarningPixSkipListFactory = factory;
