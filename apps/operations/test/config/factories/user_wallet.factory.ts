// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { UserEntity } from '@zro/users/domain';
import {
  UserWalletEntity,
  WalletEntity,
  PermissionTypeEntity,
} from '@zro/operations/domain';
import { UserWalletModel, WalletModel } from '@zro/operations/infrastructure';
import {
  PermissionTypeFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

/**
 * User Wallet factory.
 */
factory.define<UserWalletModel>(
  UserWalletModel.name,
  UserWalletModel,
  (): Partial<UserWalletModel> => {
    return {
      userId: faker.datatype.uuid(),
      walletId: factory.assoc(WalletModel.name, 'uuid'),
      permissionTypeIds: faker.random.alpha({ count: 5, casing: 'upper' }),
    };
  },
);

/**
 * User Wallet entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, UserWalletEntity.name);

factory.define<UserWalletEntity>(
  UserWalletEntity.name,
  DefaultModel,
  async (): Promise<Partial<UserWalletEntity>> => {
    return {
      id: faker.datatype.uuid(),
      user: await UserFactory.create<UserEntity>(UserEntity.name),
      wallet: await WalletFactory.create<WalletEntity>(WalletEntity.name),
      permissionTypes: [
        await PermissionTypeFactory.create<PermissionTypeEntity>(
          PermissionTypeEntity.name,
        ),
      ],
    };
  },
  {
    afterBuild: (model) => {
      return new UserWalletEntity(model);
    },
  },
);

export const UserWalletFactory = factory;
