// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';

import { DefaultModel } from '@zro/common/test';
import { QrCodeModel } from '@zro/pix-zro-pay/infrastructure';
import { QrCodeEntity } from '@zro/pix-zro-pay/domain';

const fakerModel = () => ({
  transactionUuid: faker.datatype.uuid(),
  txId: faker.datatype.uuid(),
  description: faker.datatype.string(),
  payerDocument: faker.datatype.number(),
  emv: faker.datatype.string(),
  expirationDate: faker.datatype.string(),
  value: faker.datatype.number(),
  merchantId: faker.datatype.uuid(),
  gatewayName: faker.datatype.string(),
  createdAt: faker.datatype.datetime(),
});

/**
 * QrCode model factory.
 */
factory.define<QrCodeModel>(QrCodeModel.name, QrCodeModel, () => {
  return fakerModel();
});

/**
 * QrCode entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, QrCodeEntity.name);

factory.define<QrCodeEntity>(
  QrCodeEntity.name,
  DefaultModel,
  async () => {
    return fakerModel();
  },
  {
    afterBuild: (model) => {
      return new QrCodeEntity(model);
    },
  },
);

export const QrCodeFactory = factory;
