import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import {
  WalletAccountTransactionEntity,
  WalletAccountTransactionType,
} from '@zro/operations/domain';
import {
  CurrencyModel,
  OperationModel,
  TransactionTypeModel,
  WalletAccountModel,
  WalletAccountTransactionModel,
  WalletModel,
} from '@zro/operations/infrastructure';
import {
  CurrencyFactory,
  OperationFactory,
  WalletAccountFactory,
  WalletAccountTransactionFactory,
  WalletFactory,
} from '@zro/test/operations/config';

describe('WalletAccountTransactionModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.operations.env'] }),
        DatabaseModule.forFeature([
          CurrencyModel,
          TransactionTypeModel,
          WalletModel,
          WalletAccountModel,
          OperationModel,
          WalletAccountTransactionModel,
        ]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const currency = await CurrencyFactory.create<CurrencyModel>(
      CurrencyModel.name,
    );

    const ownerWallet = await WalletFactory.create<WalletModel>(
      WalletModel.name,
    );
    const ownerWalletAccount =
      await WalletAccountFactory.create<WalletAccountModel>(
        WalletAccountModel.name,
        {
          walletId: ownerWallet.id,
          walletUUID: ownerWallet.uuid,
          currencyId: currency.id,
        },
      );

    const operation = await OperationFactory.create<OperationModel>(
      OperationModel.name,
      {
        ownerId: ownerWallet.userId,
        beneficiaryId: 0,
        ownerWalletAccountId: ownerWalletAccount.id,
        beneficiaryWalletAccountId: 0,
        currencyId: currency.id,
      },
    );

    const walletAccountTransaction =
      await WalletAccountTransactionFactory.create<WalletAccountTransactionModel>(
        WalletAccountTransactionModel.name,
        {
          walletAccountId: ownerWalletAccount.id,
          operationId: operation.id,
        },
      );

    expect(walletAccountTransaction).toBeDefined();
    expect(walletAccountTransaction.id).toBeDefined();
    expect(walletAccountTransaction.operationId).toBe(operation.id);
    expect(walletAccountTransaction.walletAccountId).toBe(
      ownerWalletAccount.id,
    );
    expect(walletAccountTransaction.value).toBeDefined();
    expect(walletAccountTransaction.previousBalance).toBeDefined();
    expect(walletAccountTransaction.updatedBalance).toBeDefined();
  });

  it('TC0002 - should create with model', async () => {
    const currency = await CurrencyFactory.create<CurrencyModel>(
      CurrencyModel.name,
    );

    const ownerWallet = await WalletFactory.create<WalletModel>(
      WalletModel.name,
    );
    const ownerWalletAccount =
      await WalletAccountFactory.create<WalletAccountModel>(
        WalletAccountModel.name,
        {
          walletId: ownerWallet.id,
          walletUUID: ownerWallet.uuid,
          currencyId: currency.id,
        },
      );

    const operation = await OperationFactory.create<OperationModel>(
      OperationModel.name,
      {
        ownerId: ownerWallet.userId,
        beneficiaryId: 0,
        ownerWalletAccountId: ownerWalletAccount.id,
        beneficiaryWalletAccountId: 0,
        currencyId: currency.id,
      },
    );
    const walletAccountTransaction = new WalletAccountTransactionEntity({
      walletAccount: ownerWalletAccount,
      operation: operation.toDomain(),
      value: 10000,
      transactionType: WalletAccountTransactionType.CREDIT,
      previousBalance: 20000,
      updatedBalance: 30000,
    });

    const createdWalletAccountTransaction = new WalletAccountTransactionModel(
      walletAccountTransaction,
    );
    await createdWalletAccountTransaction.save();

    expect(createdWalletAccountTransaction).toBeDefined();
    expect(createdWalletAccountTransaction.id).toBeDefined();
    expect(createdWalletAccountTransaction.walletAccountId).toBe(
      ownerWalletAccount.id,
    );
    expect(createdWalletAccountTransaction.operationId).toBe(operation.id);
  });

  afterAll(async () => {
    await module.close();
  });
});
