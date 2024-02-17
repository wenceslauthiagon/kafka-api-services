import { Sequelize } from 'sequelize-typescript';
import { Test, TestingModule } from '@nestjs/testing';
import {
  DATABASE_PROVIDER,
  MissingDataException,
  defaultLogger as logger,
} from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';
import {
  GetWalletAccountByUserAndCurrencyUseCase,
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
 * Test get wallet account by user and currency use case.
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
    const found = await WalletModel.findOne({ where: { userUUID: user.uuid } });

    const wallet =
      found ??
      (await WalletFactory.create<WalletModel>(WalletModel.name, {
        userId: user.id,
        userUUID: user.uuid,
      }));

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

  const executeUseCase = async (user: User, currency: Currency) => {
    const transaction = await sequelize.transaction();

    try {
      const walletAccountRepository = new WalletAccountDatabaseRepository(
        transaction,
      );
      const currencyRepository = new CurrencyDatabaseRepository(transaction);
      const usecase = new GetWalletAccountByUserAndCurrencyUseCase(
        logger,
        walletAccountRepository,
        currencyRepository,
      );

      const operation = await usecase.execute(user, currency);

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

        const foundWalletAccount = await executeUseCase(user, currency);

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

        const foundWalletAccount1 = await executeUseCase(user, currency1);

        expect(foundWalletAccount1).not.toBeNull();
        expect(foundWalletAccount1.id).toBe(walletAccount1.id);

        const foundWalletAccount2 = await executeUseCase(user, currency2);

        expect(foundWalletAccount2).not.toBeNull();
        expect(foundWalletAccount2.id).toBe(walletAccount2.id);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not get wallet account with invalid user id', async () => {
        const currency = await createCurrency();
        const user = await createUser();
        await createWalletAccount(currency, user);

        const foundWalletAccount = await executeUseCase(
          { id: -1, uuid: '1660df18-87b0-46fe-826f-9b43666acf34' } as User,
          currency,
        );

        expect(foundWalletAccount).toBeNull();
      });

      it('TC0004 - Should not get wallet account without user id', async () => {
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
        await createWalletAccount(currency, user);

        await expect(executeUseCase(user, null)).rejects.toThrow(
          MissingDataException,
        );
      });

      it('TC0006 - Should not get wallet account with invalid currency tag', async () => {
        const currency = await createCurrency();
        const user = await createUser();
        await createWalletAccount(currency, user);

        currency.tag = 'XXXXXXX';
        await expect(executeUseCase(user, currency)).rejects.toThrow(
          CurrencyNotFoundException,
        );
      });

      it('TC0007 - Should not get wallet account if it is deleted', async () => {
        const currency = await createCurrency();
        const user = await createUser();
        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
          { userId: user.id, userUUID: user.uuid },
        );
        await WalletAccountFactory.create<WalletAccountModel>(
          WalletAccountModel.name,
          {
            walletId: wallet.id,
            walletUUID: wallet.uuid,
            currencyId: currency.id,
            deletedAt: new Date(),
          },
        );

        const foundWalletAccount = await executeUseCase(user, currency);

        expect(foundWalletAccount).toBeNull();
      });

      it('TC0008 - Should not get wallet if it is deleted', async () => {
        const currency = await createCurrency();
        const user = await createUser();
        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
          {
            userId: user.id,
            userUUID: user.uuid,
            deletedAt: new Date(),
          },
        );
        await WalletAccountFactory.create<WalletAccountModel>(
          WalletAccountModel.name,
          {
            walletId: wallet.id,
            walletUUID: wallet.uuid,
            currencyId: currency.id,
          },
        );

        const foundWalletAccount = await executeUseCase(user, currency);

        expect(foundWalletAccount).toBeNull();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
