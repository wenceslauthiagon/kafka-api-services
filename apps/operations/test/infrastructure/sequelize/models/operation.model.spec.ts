import { v4 as uuidV4 } from 'uuid';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { OperationEntity } from '@zro/operations/domain';
import {
  CurrencyModel,
  OperationModel,
  TransactionTypeModel,
  WalletAccountModel,
  WalletModel,
} from '@zro/operations/infrastructure';
import {
  CurrencyFactory,
  OperationFactory,
  TransactionTypeFactory,
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';

describe('OperationModel', () => {
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

    const beneficiaryWallet = await WalletFactory.create<WalletModel>(
      WalletModel.name,
    );
    const beneficiaryWalletAccount =
      await WalletAccountFactory.create<WalletAccountModel>(
        WalletAccountModel.name,
        {
          walletId: beneficiaryWallet.id,
          walletUUID: beneficiaryWallet.uuid,
          currencyId: currency.id,
        },
      );

    const operation = await OperationFactory.create<OperationModel>(
      OperationModel.name,
      {
        ownerId: ownerWallet.userId,
        beneficiaryId: beneficiaryWallet.userId,
        ownerWalletAccountId: ownerWalletAccount.id,
        beneficiaryWalletAccountId: beneficiaryWalletAccount.id,
        currencyId: currency.id,
      },
    );
    expect(operation).toBeDefined();
    expect(operation.id).toBeDefined();
    expect(operation.currencyId).toBe(currency.id);
    expect(operation.transactionTypeId).toBeDefined();
    expect(operation.ownerId).toBe(ownerWallet.userId);
    expect(operation.beneficiaryId).toBe(beneficiaryWallet.userId);
    expect(operation.ownerWalletAccountId).toBe(ownerWalletAccount.id);
    expect(operation.beneficiaryWalletAccountId).toBe(
      beneficiaryWalletAccount.id,
    );
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

    const beneficiaryWallet = await WalletFactory.create<WalletModel>(
      WalletModel.name,
    );
    const beneficiaryWalletAccount =
      await WalletAccountFactory.create<WalletAccountModel>(
        WalletAccountModel.name,
        {
          walletId: beneficiaryWallet.id,
          walletUUID: beneficiaryWallet.uuid,
          currencyId: currency.id,
        },
      );

    const transactionType =
      await TransactionTypeFactory.create<TransactionTypeModel>(
        TransactionTypeModel.name,
      );

    const operation = new OperationEntity({
      id: uuidV4(),
      owner: ownerWallet.toDomain().user,
      beneficiary: beneficiaryWallet.toDomain().user,
      ownerWalletAccount,
      beneficiaryWalletAccount,
      currency,
      transactionType,
      description: 'TC0002',
    });

    const createdOperation = new OperationModel(operation);
    await createdOperation.save();

    expect(createdOperation).toBeDefined();
    expect(createdOperation.id).toBeDefined();
    expect(createdOperation.currencyId).toBe(currency.id);
    expect(createdOperation.transactionTypeId).toBeDefined();
    expect(createdOperation.ownerId).toBe(ownerWallet.userId);
    expect(createdOperation.beneficiaryId).toBe(beneficiaryWallet.userId);
    expect(createdOperation.ownerWalletAccountId).toBe(ownerWalletAccount.id);
    expect(createdOperation.beneficiaryWalletAccountId).toBe(
      beneficiaryWalletAccount.id,
    );
  });

  afterAll(async () => {
    await module.close();
  });
});
