import { Sequelize } from 'sequelize-typescript';
import { Test, TestingModule } from '@nestjs/testing';
import {
  DATABASE_PROVIDER,
  MissingDataException,
  defaultLogger as logger,
} from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { Currency, WalletState } from '@zro/operations/domain';
import {
  GetWalletAccountByAccountNumberAndCurrencyUseCase,
  CurrencyNotFoundException,
} from '@zro/operations/application';
import {
  CurrencyModel,
  WalletAccountDatabaseRepository,
  WalletAccountModel,
  WalletModel,
  CurrencyDatabaseRepository,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import {
  CurrencyFactory,
  WalletFactory,
  WalletAccountFactory,
} from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

/**
 * Test get wallet account by account number and currency use case.
 */
describe('Testing create operation use case.', () => {
  let module: TestingModule;
  let sequelize: Sequelize;

  const createCurrency = async (): Promise<CurrencyModel> => {
    return CurrencyFactory.create<CurrencyModel>(CurrencyModel.name);
  };

  const createUser = async (): Promise<User> => {
    return UserFactory.create<UserEntity>(UserEntity.name, { active: true });
  };

  type CreatedWalletAccount = {
    wallet: WalletModel;
    walletAccount: WalletAccountModel;
  };

  const createWalletAccount = async (
    currency: CurrencyModel,
    user: User,
    { balance, pendingAmount } = { balance: 100000, pendingAmount: 10000 },
  ): Promise<CreatedWalletAccount> => {
    const wallet = await WalletFactory.create<WalletModel>(WalletModel.name, {
      userId: user.id,
      userUUID: user.uuid,
      state: WalletState.ACTIVE,
    });
    const walletAccount = await WalletAccountFactory.create<WalletAccountModel>(
      WalletAccountModel.name,
      {
        walletId: wallet.id,
        walletUUID: wallet.uuid,
        currencyId: currency.id,
        balance,
        pendingAmount,
      },
    );

    return { wallet, walletAccount };
  };

  const executeUseCase = async (accountNumber: string, currency: Currency) => {
    const transaction = await sequelize.transaction();

    try {
      const walletAccountRepository = new WalletAccountDatabaseRepository(
        transaction,
      );
      const currencyRepository = new CurrencyDatabaseRepository(transaction);
      const usecase = new GetWalletAccountByAccountNumberAndCurrencyUseCase(
        logger,
        walletAccountRepository,
        currencyRepository,
      );

      const operation = await usecase.execute(accountNumber, currency);

      await transaction.commit();

      return operation;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    sequelize = module.get(DATABASE_PROVIDER);
  });

  describe('Get wallet account', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get one wallet account successfully', async () => {
        const currency = await createCurrency();
        const user = await createUser();
        const { walletAccount } = await createWalletAccount(currency, user);

        const foundWalletAccount = await executeUseCase(
          walletAccount.accountNumber,
          currency,
        );

        expect(foundWalletAccount).not.toBeNull();
        expect(foundWalletAccount.id).toBe(walletAccount.id);
      });

      it('TC0002 - Should get one of two wallet accounts successfully', async () => {
        const user = await createUser();
        const currency1 = await createCurrency();
        const { walletAccount: walletAccount1 } = await createWalletAccount(
          currency1,
          user,
        );

        const currency2 = await createCurrency();
        const { walletAccount: walletAccount2 } = await createWalletAccount(
          currency2,
          user,
        );

        const foundWalletAccount1 = await executeUseCase(
          walletAccount1.accountNumber,
          currency1,
        );

        expect(foundWalletAccount1).not.toBeNull();
        expect(foundWalletAccount1.id).toBe(walletAccount1.id);

        const foundWalletAccount2 = await executeUseCase(
          walletAccount2.accountNumber,
          currency2,
        );

        expect(foundWalletAccount2).not.toBeNull();
        expect(foundWalletAccount2.id).toBe(walletAccount2.id);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not get wallet account with invalid account number', async () => {
        const currency = await createCurrency();
        const user = await createUser();
        const accountNumber = '1234';
        await createWalletAccount(currency, user);

        const foundWalletAccount = await executeUseCase(
          accountNumber,
          currency,
        );

        expect(foundWalletAccount).toBeNull();
      });

      it('TC0004 - Should not get wallet account without accountNumber', async () => {
        const currency = await createCurrency();
        const user = await createUser();
        await createWalletAccount(currency, user);

        await expect(executeUseCase(null, currency)).rejects.toThrow(
          MissingDataException,
        );
      });

      it('TC0005 - Should not get wallet account without currency tag', async () => {
        const currency = await createCurrency();
        const user = await createUser();
        const { walletAccount } = await createWalletAccount(currency, user);

        await expect(
          executeUseCase(walletAccount.accountNumber, null),
        ).rejects.toThrow(MissingDataException);
      });

      it('TC0006 - Should not get wallet account with invalid currency tag', async () => {
        const currency = await createCurrency();
        const user = await createUser();
        const { walletAccount } = await createWalletAccount(currency, user);

        currency.tag = 'XXXXXXX';
        await expect(
          executeUseCase(walletAccount.accountNumber, currency),
        ).rejects.toThrow(CurrencyNotFoundException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
