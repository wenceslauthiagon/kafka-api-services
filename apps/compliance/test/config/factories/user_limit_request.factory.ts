// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  UserLimitRequestEntity,
  UserLimitRequestState,
  UserLimitRequestStatus,
} from '@zro/compliance/domain';
import { UserEntity } from '@zro/users/domain';
import { UserLimitEntity } from '@zro/operations/domain';
import { UserLimitRequestModel } from '@zro/compliance/infrastructure';

/**
 * User limit request model factory.
 */
factory.define<UserLimitRequestModel>(
  UserLimitRequestModel.name,
  UserLimitRequestModel,
  () => {
    return {
      userId: faker.datatype.uuid(),
      userLimitId: faker.datatype.uuid(),
      limitTypeDescription: faker.datatype.string(15),
      status: UserLimitRequestStatus.OPEN,
      state: UserLimitRequestState.OPEN_CONFIRMED,
    };
  },
);

/**
 * User limit request entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, UserLimitRequestEntity.name);

factory.define<UserLimitRequestEntity>(
  UserLimitRequestEntity.name,
  DefaultModel,
  async () => {
    const user = new UserEntity({ uuid: faker.datatype.uuid() });
    const userLimit = new UserLimitEntity({ id: faker.datatype.uuid() });

    return {
      id: faker.datatype.uuid(),
      status: UserLimitRequestStatus.OPEN,
      state: UserLimitRequestState.OPEN_CONFIRMED,
      user,
      userLimit,
      limitTypeDescription: faker.datatype.string(15),
      createdAt: faker.date.recent(999),
      updatedAt: faker.date.recent(9999),
    };
  },
  {
    afterBuild: (model) => {
      return new UserLimitRequestEntity(model);
    },
  },
);

export const UserLimitRequestFactory = factory;
