// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { UserEntity } from '@zro/users/domain';
import {
  PermissionTypeEntity,
  WalletEntity,
  WalletInvitationEntity,
  WalletInvitationState,
} from '@zro/operations/domain';
import {
  WalletInvitationModel,
  WalletModel,
} from '@zro/operations/infrastructure';
import { PermissionTypeFactory } from '@zro/test/operations/config';

const states = Object.values(WalletInvitationState);

const fakerModel = () => {
  const state = states[Math.floor(Math.random() * states.length)];

  return {
    id: faker.datatype.uuid(),
    email: faker.internet.email(),
    state,
    permissionTypeIds: faker.random.alpha({ count: 5, casing: 'upper' }),
    confirmCode: faker.datatype.string(5),
    expiredAt: faker.date.future(),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };
};

/**
 * WalletInvitation factory.
 */
factory.define<WalletInvitationModel>(
  WalletInvitationModel.name,
  WalletInvitationModel,
  async () => ({
    userId: faker.datatype.uuid(),
    walletId: factory.assoc(WalletModel.name, 'uuid'),
    ...fakerModel(),
  }),
);

/**
 * WalletInvitation entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, WalletInvitationEntity.name);

factory.define<WalletInvitationEntity>(
  WalletInvitationEntity.name,
  DefaultModel,
  async (): Promise<Partial<WalletInvitationEntity>> => ({
    user: new UserEntity({
      uuid: faker.datatype.uuid(),
      email: faker.internet.email(
        faker.name.firstName(),
        faker.name.lastName() + faker.datatype.number(9999).toString(),
        'zrobank.com.br',
      ),
    }),
    wallet: new WalletEntity({ uuid: faker.datatype.uuid() }),
    permissionTypes: [
      await PermissionTypeFactory.create<PermissionTypeEntity>(
        PermissionTypeEntity.name,
      ),
    ],
    ...fakerModel(),
  }),
  {
    afterBuild: (model) => {
      return new WalletInvitationEntity(model);
    },
  },
);

export const WalletInvitationFactory = factory;
