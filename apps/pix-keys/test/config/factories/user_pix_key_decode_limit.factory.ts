// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { UserEntity } from '@zro/users/domain';
import { UserPixKeyDecodeLimitEntity } from '@zro/pix-keys/domain';
import { UserPixKeyDecodeLimitModel } from '@zro/pix-keys/infrastructure';

const fakerModel = (): Partial<UserPixKeyDecodeLimitEntity> => ({
  id: faker.datatype.uuid(),
  limit: faker.datatype.number({ min: 1, max: 99999 }),
  lastDecodedCreatedAt: faker.date.recent(2),
  createdAt: faker.date.recent(2),
  updatedAt: faker.date.recent(2),
});

/**
 * DecodedPixKey factory.
 */
factory.define<UserPixKeyDecodeLimitModel>(
  UserPixKeyDecodeLimitModel.name,
  UserPixKeyDecodeLimitModel,
  () => ({
    ...fakerModel(),
    userId: faker.datatype.uuid(),
  }),
);

/**
 * DecodedPixKey entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, UserPixKeyDecodeLimitEntity.name);

factory.define<UserPixKeyDecodeLimitEntity>(
  UserPixKeyDecodeLimitEntity.name,
  DefaultModel,
  () => ({
    ...fakerModel(),
    user: new UserEntity({ uuid: faker.datatype.uuid() }),
  }),
  {
    afterBuild: (model) => {
      return new UserPixKeyDecodeLimitEntity(model);
    },
  },
);

export const UserPixKeyDecodeLimitFactory = factory;
