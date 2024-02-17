import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { WalletAccountEntity } from '@zro/operations/domain';
import {
  CurrencyModel,
  WalletAccountModel,
  WalletModel,
} from '@zro/operations/infrastructure';
import {
  CurrencyFactory,
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';

describe('WalletAccountModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.operations.env'] }),
        DatabaseModule.forFeature([
          CurrencyModel,
          WalletModel,
          WalletAccountModel,
        ]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const wallet = await WalletFactory.create<WalletModel>(WalletModel.name);
    const currency = await CurrencyFactory.create<CurrencyModel>(
      CurrencyModel.name,
    );
    const walletAccount = await WalletAccountFactory.create<WalletAccountModel>(
      WalletAccountModel.name,
      {
        walletId: wallet.id,
        walletUUID: wallet.uuid,
        currencyId: currency.id,
      },
    );
    expect(walletAccount).toBeDefined();
    expect(walletAccount.id).toBeDefined();
    expect(walletAccount.currencyId).toBe(currency.id);
    expect(walletAccount.walletId).toBe(wallet.id);
  });

  it('TC0002 - should create with model', async () => {
    const wallet = await WalletFactory.create<WalletModel>(WalletModel.name);
    const currency = await CurrencyFactory.create<CurrencyModel>(
      CurrencyModel.name,
    );

    const walletAccount = new WalletAccountEntity({
      wallet,
      currency,
      pendingAmount: 0,
      balance: 1000,
      accountNumber: '12321312',
      branchNumber: '0001',
    });

    const createdWalletAccount = new WalletAccountModel(walletAccount);
    await createdWalletAccount.save();

    expect(createdWalletAccount).toBeDefined();
    expect(createdWalletAccount.id).toBeDefined();
    expect(createdWalletAccount.currencyId).toBe(currency.id);
    expect(createdWalletAccount.walletId).toBe(wallet.id);
  });

  afterAll(async () => {
    await module.close();
  });
});
