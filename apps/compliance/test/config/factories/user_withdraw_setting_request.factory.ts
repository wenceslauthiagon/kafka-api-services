// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  UserWithdrawSettingRequest,
  UserWithdrawSettingRequestEntity,
  UserWithdrawSettingRequestState,
  WithdrawSettingType,
} from '@zro/compliance/domain';
import { UserEntity } from '@zro/users/domain';
import { UserWithdrawSettingRequestModel } from '@zro/compliance/infrastructure';
import {
  TransactionTypeFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import { TransactionTypeEntity, WalletEntity } from '@zro/operations/domain';
import { UserFactory } from '@zro/test/users/config';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import { PixKeyEntity } from '@zro/pix-keys/domain';

const states = Object.values(UserWithdrawSettingRequestState);
const types = Object.values(WithdrawSettingType);

const fakerModel = (): Partial<UserWithdrawSettingRequest> => {
  const state = states[Math.floor(Math.random() * states.length)];
  const type = types[Math.floor(Math.random() * types.length)];

  return {
    id: faker.datatype.uuid(),
    state,
    type,
    balance: faker.datatype.number({ min: 1, max: 9999999999999 }),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };
};

/**
 * User withdraw setting request model factory.
 */
factory.define<UserWithdrawSettingRequestModel>(
  UserWithdrawSettingRequestModel.name,
  UserWithdrawSettingRequestModel,
  async () => {
    const wallet = await WalletFactory.create<WalletEntity>(WalletEntity.name);
    const user = await UserFactory.create<UserEntity>(UserEntity.name);
    const transactionType =
      await TransactionTypeFactory.create<TransactionTypeEntity>(
        TransactionTypeEntity.name,
      );
    const pixKey = await PixKeyFactory.create<PixKeyEntity>(PixKeyEntity.name);

    return {
      ...fakerModel(),
      wallet,
      user,
      transactionType,
      pixKey,
    };
  },
);

/**
 * User withdraw setting request entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, UserWithdrawSettingRequestEntity.name);

factory.define<UserWithdrawSettingRequestEntity>(
  UserWithdrawSettingRequestEntity.name,
  DefaultModel,
  async () => {
    const wallet = await WalletFactory.create<WalletEntity>(WalletEntity.name);
    const user = await UserFactory.create<UserEntity>(UserEntity.name);
    const transactionType =
      await TransactionTypeFactory.create<TransactionTypeEntity>(
        TransactionTypeEntity.name,
      );
    const pixKey = await PixKeyFactory.create<PixKeyEntity>(PixKeyEntity.name);

    return {
      ...fakerModel(),
      wallet,
      user,
      transactionType,
      pixKey,
    };
  },
  {
    afterBuild: (model) => {
      return new UserWithdrawSettingRequestEntity(model);
    },
  },
);

export const UserWithdrawSettingRequestFactory = factory;
