// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { UserEntity } from '@zro/users/domain';
import { BellNotificationEntity } from '@zro/notifications/domain';
import { BellNotificationModel } from '@zro/notifications/infrastructure';

/**
 * BellNotification factory.
 */
factory.define<BellNotificationModel>(
  BellNotificationModel.name,
  BellNotificationModel,
  () => {
    return {
      uuid: faker.datatype.uuid(),
      title: faker.lorem.words(4),
      description: faker.lorem.words(10),
      userId: faker.datatype.number({ min: 1, max: 99999 }),
      type: faker.lorem.words(1),
      read: false,
    };
  },
);

/**
 * BellNotification entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, BellNotificationEntity.name);

factory.define<BellNotificationEntity>(
  BellNotificationEntity.name,
  DefaultModel,
  () => {
    const user = new UserEntity({
      uuid: faker.datatype.uuid(),
      id: faker.datatype.number({ min: 1, max: 99999 }),
    });
    return {
      uuid: faker.datatype.uuid(),
      title: faker.lorem.words(4),
      description: faker.lorem.words(10),
      user,
      type: faker.lorem.words(1),
      read: false,
    };
  },
  {
    afterBuild: (model) => {
      return new BellNotificationEntity(model);
    },
  },
);

export const BellNotificationFactory = factory;
