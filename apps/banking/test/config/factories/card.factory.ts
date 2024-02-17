// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { CardEntity } from '@zro/banking/domain';
import { UserEntity } from '@zro/users/domain';
import { CardModel } from '@zro/banking/infrastructure';
import { UserFactory } from '@zro/test/users/config';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  isVirtual: false,
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * Card model factory.
 */
factory.define<CardModel>(CardModel.name, CardModel, () => ({
  ...fakerModel(),
  userId: faker.datatype.number({ min: 1, max: 999 }),
}));

/**
 * Card entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, CardEntity.name);

factory.define<CardEntity>(
  CardEntity.name,
  DefaultModel,
  async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    return Object.assign({}, fakerModel(), { user });
  },
  {
    afterBuild: (model) => {
      return new CardEntity(model);
    },
  },
);

export const CardFactory = factory;
