// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { UserEntity } from '@zro/users/domain';
import { WalletEntity, WalletState } from '@zro/operations/domain';
import { WalletModel } from '@zro/operations/infrastructure';
import { UserFactory } from '@zro/test/users/config';

const fakerModel = () => ({
  uuid: faker.datatype.uuid(),
  name: faker.datatype.string(10),
  default: true,
  state: states[Math.floor(Math.random() * states.length)],
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

const states = Object.values(WalletState);

/**
 * Wallet factory.
 */
factory.define<WalletModel>(WalletModel.name, WalletModel, () => ({
  userId: faker.datatype.number({ min: 1, max: 99999 }),
  userUUID: faker.datatype.uuid(),
  ...fakerModel(),
}));

/**
 * Wallet entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, WalletEntity.name);

factory.define<WalletEntity>(
  WalletEntity.name,
  DefaultModel,
  async () => ({
    user: await UserFactory.create<UserEntity>(UserEntity.name),
    id: faker.datatype.number({ min: 1, max: 99999 }),
    ...fakerModel(),
  }),
  {
    afterBuild: (model) => {
      return new WalletEntity(model);
    },
  },
);

export const WalletFactory = factory;
