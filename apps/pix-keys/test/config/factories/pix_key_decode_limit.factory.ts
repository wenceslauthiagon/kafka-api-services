// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { PersonType } from '@zro/users/domain';
import { PixKeyDecodeLimitEntity } from '@zro/pix-keys/domain';
import { PixKeyDecodeLimitModel } from '@zro/pix-keys/infrastructure';

const fakerModel = (): Partial<PixKeyDecodeLimitEntity> => ({
  id: faker.datatype.uuid(),
  limit: faker.datatype.number({ min: 1, max: 99999 }),
  personType: PersonType.NATURAL_PERSON,
  createdAt: faker.date.recent(2),
  updatedAt: faker.date.recent(2),
});

/**
 * DecodedPixKey factory.
 */
factory.define<PixKeyDecodeLimitModel>(
  PixKeyDecodeLimitModel.name,
  PixKeyDecodeLimitModel,
  () => fakerModel(),
);

/**
 * DecodedPixKey entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PixKeyDecodeLimitEntity.name);

factory.define<PixKeyDecodeLimitEntity>(
  PixKeyDecodeLimitEntity.name,
  DefaultModel,
  () => fakerModel(),
  {
    afterBuild: (model) => {
      return new PixKeyDecodeLimitEntity(model);
    },
  },
);

export const PixKeyDecodeLimitFactory = factory;
