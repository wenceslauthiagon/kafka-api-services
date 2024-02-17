// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { UserEntity } from '@zro/users/domain';
import { KeyType, PixKeyEntity } from '@zro/pix-keys/domain';
import {
  QrCodeStaticEntity,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import { QrCodeStaticModel } from '@zro/pix-payments/infrastructure';

/**
 * QrCodeStatic factory.
 */
factory.define<QrCodeStaticModel>(
  QrCodeStaticModel.name,
  QrCodeStaticModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      userId: faker.datatype.uuid(),
      key: faker.datatype.uuid(),
      keyId: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      txId: faker.datatype.string(25),
      recipientCity: faker.address.cityName(),
      recipientName: faker.name.fullName(),
      expirationDate: faker.date.future(),
      payableManyTimes: faker.datatype.boolean(),
      state: QrCodeStaticState.READY,
    };
  },
);

/**
 * QrCodeStatic entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, QrCodeStaticEntity.name);

factory.define<QrCodeStaticEntity>(
  QrCodeStaticEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      user: new UserEntity({ uuid: faker.datatype.uuid() }),
      pixKey: new PixKeyEntity({
        id: faker.datatype.uuid(),
        key: faker.datatype.uuid(),
        type: KeyType.EVP,
      }),
      txId: faker.datatype.string(25),
      recipientCity: faker.address.cityName(),
      recipientName: faker.name.fullName(),
      expirationDate: faker.date.future(),
      payableManyTimes: faker.datatype.boolean(),
      state: QrCodeStaticState.READY,
    };
  },
  {
    afterBuild: (model) => {
      return new QrCodeStaticEntity(model);
    },
  },
);

export const QrCodeStaticFactory = factory;
