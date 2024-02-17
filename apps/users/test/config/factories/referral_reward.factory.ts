// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { OperationEntity } from '@zro/operations/domain';
import { UserEntity, ReferralRewardEntity } from '@zro/users/domain';
import { UserModel, ReferralRewardModel } from '@zro/users/infrastructure';
import { UserFactory } from '@zro/test/users/config';
import { OperationFactory } from '@zro/test/operations/config';

/**
 * ReferralReward factory.
 */
factory.define<ReferralRewardModel>(
  ReferralRewardModel.name,
  ReferralRewardModel,
  async () => {
    const awardedBy = await UserFactory.create<UserModel>(UserModel.name);
    const awardedTo = await UserFactory.create<UserModel>(UserModel.name);

    return {
      awardedById: awardedBy.id,
      awardedByUuid: awardedBy.uuid,
      awardedToId: awardedTo.id,
      awardedToUuid: awardedTo.uuid,
      operationId: faker.datatype.uuid(),
      amount: faker.datatype.number({ min: 0, max: 99999 }),
    };
  },
);

/**
 * ReferralReward entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, ReferralRewardEntity.name);

factory.define<ReferralRewardEntity>(
  ReferralRewardEntity.name,
  DefaultModel,
  async () => ({
    id: faker.datatype.number({ min: 1, max: 99999 }),
    amount: faker.datatype.number({ min: 0, max: 99999 }),
    awardedBy: await UserFactory.create<UserEntity>(UserEntity.name),
    awardedTo: await UserFactory.create<UserEntity>(UserEntity.name),
    operation: await OperationFactory.create<OperationEntity>(
      OperationEntity.name,
    ),
    createdAt: faker.date.recent(9999),
  }),
  {
    afterBuild: (model) => {
      return new ReferralRewardEntity(model);
    },
  },
);

export const ReferralRewardFactory = factory;
