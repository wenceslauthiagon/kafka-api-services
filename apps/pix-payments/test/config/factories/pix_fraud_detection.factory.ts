// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common';
import {
  PixFraudDetectionEntity,
  PixFraudDetectionState,
  PixFraudDetectionStatus,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';
import { PixFraudDetectionModel } from '@zro/pix-payments/infrastructure';
import { PersonType } from '@zro/users/domain';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  externalId: faker.datatype.uuid(),
  personType: PersonType.NATURAL_PERSON,
  document: cpf.generate(),
  fraudType: PixFraudDetectionType.FRAUDSTER_ACCOUNT,
  key: faker.datatype.uuid(),
  status: PixFraudDetectionStatus.RECEIVED,
  state: PixFraudDetectionState.RECEIVED_CONFIRMED,
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * PixFraudDetection model factory.
 */
factory.define<PixFraudDetectionModel>(
  PixFraudDetectionModel.name,
  PixFraudDetectionModel,
  () => fakerModel(),
);

/**
 * PixFraudDetection entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PixFraudDetectionEntity.name);

factory.define<PixFraudDetectionEntity>(
  PixFraudDetectionEntity.name,
  DefaultModel,
  () => fakerModel(),
  {
    afterBuild: (model) => {
      return new PixFraudDetectionEntity(model);
    },
  },
);

export const PixFraudDetectionFactory = factory;
