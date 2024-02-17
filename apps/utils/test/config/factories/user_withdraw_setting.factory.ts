// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  UserWithdrawSetting,
  UserWithdrawSettingEntity,
  WithdrawSettingState,
  WithdrawSettingType,
} from '@zro/utils/domain';
import { UserEntity } from '@zro/users/domain';
import { UserWithdrawSettingModel } from '@zro/utils/infrastructure';
import {
  TransactionTypeFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import { TransactionTypeEntity, WalletEntity } from '@zro/operations/domain';
import { UserFactory } from '@zro/test/users/config';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import { PixKeyEntity } from '@zro/pix-keys/domain';

const states = Object.values(WithdrawSettingState);
const types = Object.values(WithdrawSettingType);

const fakerModel = (): Partial<UserWithdrawSetting> => {
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
 * User withdraw setting model factory.
 */
factory.define<UserWithdrawSettingModel>(
  UserWithdrawSettingModel.name,
  UserWithdrawSettingModel,
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
 * User withdraw setting entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, UserWithdrawSettingEntity.name);

factory.define<UserWithdrawSettingEntity>(
  UserWithdrawSettingEntity.name,
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
      return new UserWithdrawSettingEntity(model);
    },
  },
);

export const UserWithdrawSettingFactory = factory;
