import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  WalletInvitationEntity,
  WalletInvitationState,
} from '@zro/operations/domain';
import {
  PermissionTypeModel,
  WalletInvitationModel,
  WalletModel,
} from '@zro/operations/infrastructure';
import {
  PermissionTypeFactory,
  WalletFactory,
  WalletInvitationFactory,
} from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('WalletInvitationModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.operations.env'] }),
        DatabaseModule.forFeature([
          WalletInvitationModel,
          WalletModel,
          PermissionTypeModel,
        ]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const walletInvitation =
      await WalletInvitationFactory.create<WalletInvitationModel>(
        WalletInvitationModel.name,
      );

    expect(walletInvitation).toBeDefined();
    expect(walletInvitation.id).toBeDefined();
    expect(walletInvitation.permissionTypeIds).toBeDefined();
  });

  it('TC0002 - should create with model', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);
    const wallet = await WalletFactory.create<WalletModel>(WalletModel.name);
    const permission = await PermissionTypeFactory.create<PermissionTypeModel>(
      PermissionTypeModel.name,
    );

    const walletInvitation = new WalletInvitationEntity({
      user,
      wallet,
      email: user.email,
      expiredAt: new Date(),
      state: WalletInvitationState.ACCEPTED,
      permissionTypes: [permission],
    });

    const createdWallet = new WalletInvitationModel(walletInvitation);
    await createdWallet.save();

    expect(createdWallet).toBeDefined();
    expect(createdWallet.id).toBeDefined();
    expect(createdWallet.walletId).toBe(wallet.uuid);
    expect(createdWallet.userId).toBe(user.uuid);
    expect(createdWallet.email).toBe(user.email);
    expect(createdWallet.state).toBe(WalletInvitationState.ACCEPTED);
    expect(createdWallet.permissionTypeIds).toBe(permission.tag);
    expect(createdWallet.expiredAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
