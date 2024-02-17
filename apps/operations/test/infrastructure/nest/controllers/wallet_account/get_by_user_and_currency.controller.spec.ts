import { Sequelize } from 'sequelize';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import {
  DATABASE_PROVIDER,
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { Currency, CurrencyEntity, WalletState } from '@zro/operations/domain';
import { CurrencyNotFoundException } from '@zro/operations/application';
import {
  CurrencyDatabaseRepository,
  CurrencyModel,
  GetWalletAccountByUserAndCurrencyMicroserviceController as Controller,
  WalletAccountDatabaseRepository,
  WalletAccountModel,
  WalletModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import {
  CurrencyFactory,
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import {
  GetWalletAccountByUserAndCurrencyRequest,
  GetWalletAccountByUserAndCurrencyResponse,
} from '@zro/operations/interface';
import { UserFactory } from '@zro/test/users/config';
import { KafkaContext } from '@nestjs/microservices';

describe('GetWalletAccountByUserAndCurrencyMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
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
    currency: Currency,
    user: User,
    { balance, pendingAmount } = { balance: 100000, pendingAmount: 10000 },
  ): Promise<CreatedWalletAccount> => {
    const found = await WalletModel.findOne({
      where: { userUUID: user.uuid },
    });

    const wallet =
      found ??
      (await WalletFactory.create<WalletModel>(WalletModel.name, {
        userId: user.id,
        userUUID: user.uuid,
        state: WalletState.ACTIVE,
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

  const executeController = async (
    user: User,
    currency: Currency,
  ): Promise<GetWalletAccountByUserAndCurrencyResponse> => {
    const transaction = await sequelize.transaction();

    try {
      const walletAccountRepository = new WalletAccountDatabaseRepository(
        transaction,
      );
      const currencyRepository = new CurrencyDatabaseRepository(transaction);

      const request: GetWalletAccountByUserAndCurrencyRequest = {
        userId: user.uuid,
        currencyTag: currency.tag,
      };

      const response = await controller.execute(
        walletAccountRepository,
        currencyRepository,
        logger,
        request,
        ctx,
      );

      await transaction.commit();

      return response?.value;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    sequelize = module.get(DATABASE_PROVIDER);
  });

  describe('Get wallet account', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get one wallet account successfully', async () => {
        const currency = await createCurrency();
        const user = await createUser();
        const { wallet, walletAccount } = await createWalletAccount(
          currency,
          user,
        );

        const response = await executeController(user, currency);

        expect(response).not.toBeNull();
        expect(response.id).toBe(walletAccount.id);
        expect(response.walletId).toBe(wallet.uuid);
        expect(response.balance).toBe(walletAccount.balance);
        expect(response.pendingAmount).toBe(walletAccount.pendingAmount);
        expect(response.currencyId).toBe(currency.id);
      });

      it('TC0002 - Should get two wallet accounts successfully', async () => {
        const user = await createUser();
        const currency1 = await createCurrency();
        const { wallet: wallet1, walletAccount: walletAccount1 } =
          await createWalletAccount(currency1, user);

        const currency2 = await createCurrency();
        const { wallet: wallet2, walletAccount: walletAccount2 } =
          await createWalletAccount(currency2, user);

        const response1 = await executeController(user, currency1);

        expect(response1).not.toBeNull();
        expect(response1.id).toBe(walletAccount1.id);
        expect(response1.walletId).toBe(wallet1.uuid);
        expect(response1.balance).toBe(walletAccount1.balance);
        expect(response1.pendingAmount).toBe(walletAccount1.pendingAmount);
        expect(response1.currencyId).toBe(currency1.id);

        const response2 = await executeController(user, currency2);

        expect(response2).not.toBeNull();
        expect(response2.id).toBe(walletAccount2.id);
        expect(response2.walletId).toBe(wallet2.uuid);
        expect(response2.balance).toBe(walletAccount2.balance);
        expect(response2.pendingAmount).toBe(walletAccount2.pendingAmount);
        expect(response2.currencyId).toBe(currency2.id);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not get wallet account with invalid user id', async () => {
        const currency = await createCurrency();
        const user = await createUser();
        await createWalletAccount(currency, user);

        const testScript = () =>
          executeController(new UserEntity({ id: -1 }), currency);

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });

      it('TC0004 - Should not get wallet account with invalid user id format', async () => {
        const currency = await createCurrency();
        const user = await createUser();
        await createWalletAccount(currency, user);

        const testScript = () =>
          executeController(new UserEntity({ id: null }), currency);

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });

      it('TC0005 - Should not get wallet account without currency tag', async () => {
        const currency = await createCurrency();
        const user = await createUser();
        await createWalletAccount(currency, user);

        const testScript = () =>
          executeController(user, new CurrencyEntity({ tag: null }));

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });

      it('TC0006 - Should not get wallet account with invalid currency tag', async () => {
        const currency = await createCurrency();
        const user = await createUser();
        await createWalletAccount(currency, user);

        currency.tag = 'XXXXX';
        await expect(() => executeController(user, currency)).rejects.toThrow(
          CurrencyNotFoundException,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
