import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { WalletEntity } from '@zro/operations/domain';
import { WalletModel } from '@zro/operations/infrastructure';
import { WalletFactory } from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('WalletModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.operations.env'] }),
        DatabaseModule.forFeature([WalletModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const wallet = await WalletFactory.create<WalletModel>(WalletModel.name);
    expect(wallet).toBeDefined();
    expect(wallet.id).toBeDefined();
  });

  it('TC0002 - should create with model', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);
    const wallet = new WalletEntity({ user });

    const createdWallet = new WalletModel(wallet);
    await createdWallet.save();

    expect(createdWallet).toBeDefined();
    expect(createdWallet.id).toBeDefined();
    expect(createdWallet.userId).toBe(user.id);
  });

  afterAll(async () => {
    await module.close();
  });
});
