import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { UserWalletModel, WalletModel } from '@zro/operations/infrastructure';
import { UserWalletFactory } from '@zro/test/operations/config';

describe('UserWalletModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.operations.env'] }),
        DatabaseModule.forFeature([UserWalletModel, WalletModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const userWallet = await UserWalletFactory.create<UserWalletModel>(
      UserWalletModel.name,
    );

    expect(userWallet).toBeDefined();
    expect(userWallet.userId).toBeDefined();
    expect(userWallet.walletId).toBeDefined();
    expect(userWallet.permissionTypeIds).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
