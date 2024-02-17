// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  TransactionTypeEntity,
  TransactionTypeParticipants,
  TransactionTypeState,
} from '@zro/operations/domain';
import { TransactionTypeModel } from '@zro/operations/infrastructure';

const states = Object.values(TransactionTypeState);
const participants = Object.values(TransactionTypeParticipants);

const fakerModel = () => ({
  title: faker.lorem.words(3),
  tag: faker.random.alpha({ count: 5, casing: 'upper' }),
  method: 'A2B',
  state: states[Math.floor(Math.random() * states.length)],
  foreignDescriptionInString: faker.lorem.words(3),
  foreignDescriptionOutString: faker.lorem.words(3),
  participants: participants[Math.floor(Math.random() * participants.length)],
});

/**
 * TransactionType factory.
 */
factory.define<TransactionTypeModel>(
  TransactionTypeModel.name,
  TransactionTypeModel,
  () => fakerModel(),
);

/**
 * TransactionType entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, TransactionTypeEntity.name);

factory.define<TransactionTypeEntity>(
  TransactionTypeEntity.name,
  DefaultModel,
  () => ({
    id: faker.datatype.number({ min: 1, max: 99999 }),
    ...fakerModel(),
  }),
  {
    afterBuild: (model) => {
      return new TransactionTypeEntity(model);
    },
  },
);

export const TransactionTypeFactory = factory;
