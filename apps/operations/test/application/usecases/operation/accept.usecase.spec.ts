import { Sequelize } from 'sequelize';
import { createMock } from 'ts-auto-mock';
import { On, method } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker/locale/pt_BR';
import {
  MissingDataException,
  DATABASE_PROVIDER,
  defaultLogger as logger,
} from '@zro/common';
import {
  CurrencyFactory,
  WalletFactory,
  WalletAccountFactory,
  TransactionTypeFactory,
  OperationFactory,
} from '@zro/test/operations/config';
import { User, UserEntity } from '@zro/users/domain';
import {
  Currency,
  OperationState,
  TransactionType,
  TransactionTypeParticipants,
  TransactionTypeState,
  Wallet,
  WalletAccount,
  WalletAccountState,
  WalletAccountEntity,
  WalletAccountTransactionType,
  WalletState,
} from '@zro/operations/domain';
import {
  AcceptOperationUseCase,
  OperationNotFoundException,
  OperationInvalidStateException,
  OperationEventEmitter,
  WalletAccountNotFoundException,
  WalletAccountNotActiveException,
} from '@zro/operations/application';
import {
  WalletAccountModel,
  WalletAccountTransactionModel,
  OperationModel,
  TransactionTypeModel,
  CurrencyModel,
  WalletModel,
  OperationDatabaseRepository,
  WalletAccountDatabaseRepository,
  WalletAccountTransactionDatabaseRepository,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { UserFactory } from '@zro/test/users/config';

describe('Testing accept operation use case.', () => {
  let sequelize: Sequelize;
  let module: TestingModule;

  const operationEventEmitter: OperationEventEmitter =
    createMock<OperationEventEmitter>();
  const mockAcceptedOperationEventEmitter: jest.Mock = On(
    operationEventEmitter,
  ).get(method((mock) => mock.acceptedOperation));

  const createCurrency = async (tag = 'REAL'): Promise<CurrencyModel> => {
    const found = await CurrencyModel.findOne({
      where: { tag },
    });

    return (
      found ??
      CurrencyFactory.create<CurrencyModel>(CurrencyModel.name, { tag })
    );
  };

  const createTransactionType = async ({
    tag,
    participants,
  }: any = {}): Promise<TransactionTypeModel> => {
    const attrs: any = {
      tag: tag ?? faker.random.alpha({ count: 5, casing: 'upper' }),
      participants: participants ?? TransactionTypeParticipants.OWNER,
      state: TransactionTypeState.ACTIVE,
    };

    const found = await TransactionTypeModel.findOne({
      where: { tag: attrs.tag },
    });

    return (
      found ??
      TransactionTypeFactory.create<TransactionTypeModel>(
        TransactionTypeModel.name,
        attrs,
      )
    );
  };

  type CreatedUser = {
    user: User;
    wallet: Wallet;
    walletAccount: WalletAccount;
  };

  const createUser = async (
    currency: CurrencyModel,
    createWalletAccount = true,
    { balance, pendingAmount }: any = {},
    walletAccountState = WalletAccountState.ACTIVE,
  ): Promise<CreatedUser> => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);
    const wallet = await WalletFactory.create<WalletModel>(WalletModel.name, {
      userId: user.id,
      userUUID: user.uuid,
      state: WalletState.ACTIVE,
    });

    if (!createWalletAccount) {
      return { user, wallet, walletAccount: null };
    }

    const walletAccount = await WalletAccountFactory.create<WalletAccountModel>(
      WalletAccountModel.name,
      {
        walletId: wallet.id,
        walletUUID: wallet.uuid,
        currencyId: currency.id,
        balance: balance ?? 100000,
        pendingAmount: pendingAmount ?? 10000,
        state: walletAccountState,
      },
    );

    return { user, wallet, walletAccount };
  };

  type CreateOperation = {
    currency: Currency;
    transactionType: TransactionType;
    owner: User;
    ownerWalletAccount: WalletAccount;
    beneficiary: User;
    beneficiaryWalletAccount: WalletAccount;
    value: number;
    state: OperationState;
  };

  const createOperation = ({
    currency,
    transactionType,
    owner,
    ownerWalletAccount,
    beneficiary,
    beneficiaryWalletAccount,
    value,
    state,
  }: Partial<CreateOperation>): Promise<OperationModel> => {
    const operation: any = {
      currencyId: currency.id,
      transactionTypeId: transactionType.id,
      ownerId: 0,
      ownerWalletAccountId: 0,
      beneficiaryId: 0,
      beneficiaryWalletAccountId: 0,
      value,
      state,
    };

    if (owner && ownerWalletAccount) {
      operation.ownerId = owner.id;
      operation.ownerWalletAccountId = ownerWalletAccount.id;
    }

    if (beneficiary && beneficiaryWalletAccount) {
      operation.beneficiaryId = beneficiary.id;
      operation.beneficiaryWalletAccountId = beneficiaryWalletAccount.id;
    }

    return OperationFactory.create<OperationModel>(
      OperationModel.name,
      operation,
    );
  };

  const executeUseCase = async (id: string) => {
    const transaction = await sequelize.transaction();

    try {
      const operationRepository = new OperationDatabaseRepository(transaction);
      const walletAccountRepository = new WalletAccountDatabaseRepository(
        transaction,
      );
      const walletAccountTransactionRepository =
        new WalletAccountTransactionDatabaseRepository(transaction);

      const acceptOperationUseCase = new AcceptOperationUseCase(
        logger,
        operationRepository,
        walletAccountRepository,
        walletAccountTransactionRepository,
        operationEventEmitter,
      );

      const operation = await acceptOperationUseCase.execute(id);

      await transaction.commit();

      return operation;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  beforeEach(jest.resetAllMocks);

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    sequelize = module.get(DATABASE_PROVIDER);
  });

  describe('Accept operation', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should accept an owner operation successfully', async () => {
        const currency = await createCurrency();
        const { user, walletAccount } = await createUser(currency);
        const transactionType = await createTransactionType();
        const operation = await createOperation({
          currency,
          transactionType,
          owner: user,
          ownerWalletAccount: walletAccount,
          value: 1000,
          state: OperationState.PENDING,
        });

        const {
          operation: acceptedOperation,
          debitWalletAccount,
          debitWalletAccountTransaction: debitWalletTransaction,
        } = await executeUseCase(operation.id);

        const previousBalance =
          walletAccount.balance + walletAccount.pendingAmount;
        const updatedBalance = previousBalance - operation.value;

        expect(acceptedOperation).not.toBeNull();
        expect(acceptedOperation.state).toBe(OperationState.ACCEPTED);
        expect(mockAcceptedOperationEventEmitter).toHaveBeenCalledTimes(1);

        expect(debitWalletTransaction).not.toBeNull();
        expect(debitWalletTransaction.value).toBe(operation.value);
        expect(debitWalletTransaction.operation.id).toBe(operation.id);
        expect(debitWalletTransaction.transactionType).toBe(
          WalletAccountTransactionType.DEBIT,
        );
        expect(debitWalletTransaction.previousBalance).toBe(previousBalance);
        expect(debitWalletTransaction.updatedBalance).toBe(updatedBalance);

        expect(debitWalletAccount).not.toBeNull();
        expect(debitWalletAccount.pendingAmount).toBe(
          walletAccount.pendingAmount - operation.value,
        );
        expect(debitWalletAccount.balance).toBe(walletAccount.balance);

        const updatedOperation = await OperationModel.findOne({
          where: { id: operation.id },
        });

        expect(updatedOperation).not.toBeNull();
        expect(updatedOperation.state).toBe(OperationState.ACCEPTED);

        const updatedWalletAccount = await WalletAccountModel.findOne({
          where: { id: walletAccount.id },
        });

        expect(updatedWalletAccount).not.toBeNull();
        expect(updatedWalletAccount.balance).toBe(walletAccount.balance);
        expect(updatedWalletAccount.pendingAmount).toBe(
          walletAccount.pendingAmount - operation.value,
        );

        const walletAccountTransaction =
          await WalletAccountTransactionModel.findOne({
            where: {
              operationId: operation.id,
            },
          });

        expect(walletAccountTransaction).not.toBeNull();
        expect(walletAccountTransaction.value).toBe(operation.value);
        expect(walletAccountTransaction.previousBalance).toBe(previousBalance);
        expect(walletAccountTransaction.updatedBalance).toBe(updatedBalance);
        expect(walletAccountTransaction.transactionType).toBe(
          WalletAccountTransactionType.DEBIT,
        );
      });

      it('TC0002 - Should accept a beneficiary operation successfully', async () => {
        const currency = await createCurrency();
        const { user, walletAccount } = await createUser(currency);
        const transactionType = await createTransactionType();
        const operation = await createOperation({
          currency,
          transactionType,
          beneficiary: user,
          beneficiaryWalletAccount: walletAccount,
          value: 1000,
          state: OperationState.PENDING,
        });

        const {
          operation: acceptedOperation,
          creditWalletAccount,
          creditWalletAccountTransaction: creditWalletTransaction,
        } = await executeUseCase(operation.id);

        const previousBalance =
          walletAccount.balance + walletAccount.pendingAmount;
        const updatedBalance = previousBalance + operation.value;

        expect(acceptedOperation).not.toBeNull();
        expect(acceptedOperation.state).toBe(OperationState.ACCEPTED);
        expect(mockAcceptedOperationEventEmitter).toHaveBeenCalledTimes(1);

        expect(creditWalletTransaction).not.toBeNull();
        expect(creditWalletTransaction.value).toBe(operation.value);
        expect(creditWalletTransaction.operation.id).toBe(operation.id);
        expect(creditWalletTransaction.transactionType).toBe(
          WalletAccountTransactionType.CREDIT,
        );
        expect(creditWalletTransaction.previousBalance).toBe(previousBalance);
        expect(creditWalletTransaction.updatedBalance).toBe(updatedBalance);

        expect(creditWalletAccount).not.toBeNull();
        expect(creditWalletAccount.pendingAmount).toBe(
          walletAccount.pendingAmount,
        );
        expect(creditWalletAccount.balance).toBe(
          walletAccount.balance + operation.value,
        );

        const updatedOperation = await OperationModel.findOne({
          where: { id: operation.id },
        });

        expect(updatedOperation).not.toBeNull();
        expect(updatedOperation.state).toBe(OperationState.ACCEPTED);

        const updatedWalletAccount = await WalletAccountModel.findOne({
          where: { id: walletAccount.id },
        });

        expect(updatedWalletAccount).not.toBeNull();
        expect(updatedWalletAccount.balance).toBe(
          walletAccount.balance + operation.value,
        );
        expect(updatedWalletAccount.pendingAmount).toBe(
          walletAccount.pendingAmount,
        );

        const walletAccountTransaction =
          await WalletAccountTransactionModel.findOne({
            where: {
              operationId: operation.id,
            },
          });

        expect(walletAccountTransaction).not.toBeNull();
        expect(walletAccountTransaction.value).toBe(operation.value);
        expect(walletAccountTransaction.previousBalance).toBe(previousBalance);
        expect(walletAccountTransaction.updatedBalance).toBe(updatedBalance);
        expect(walletAccountTransaction.transactionType).toBe(
          WalletAccountTransactionType.CREDIT,
        );
      });

      it('TC0003 - Should accept a shared operation successfully', async () => {
        const currency = await createCurrency();
        const { user: user1, walletAccount: walletAccount1 } =
          await createUser(currency);
        const { user: user2, walletAccount: walletAccount2 } =
          await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BOTH,
        });

        const operation = await createOperation({
          currency,
          transactionType,
          owner: user1,
          ownerWalletAccount: walletAccount1,
          beneficiary: user2,
          beneficiaryWalletAccount: walletAccount2,
          value: 1000,
          state: OperationState.PENDING,
        });

        const {
          operation: acceptedOperation,
          debitWalletAccount,
          debitWalletAccountTransaction: debitWalletTransaction,
          creditWalletAccount,
          creditWalletAccountTransaction: creditWalletTransaction,
        } = await executeUseCase(operation.id);

        const previousBalance1 =
          walletAccount1.balance + walletAccount1.pendingAmount;
        const updatedBalance1 = previousBalance1 - operation.value;

        const previousBalance2 =
          walletAccount2.balance + walletAccount2.pendingAmount;
        const updatedBalance2 = previousBalance2 + operation.value;

        expect(acceptedOperation).not.toBeNull();
        expect(acceptedOperation.state).toBe(OperationState.ACCEPTED);
        expect(mockAcceptedOperationEventEmitter).toHaveBeenCalledTimes(1);

        expect(debitWalletTransaction).not.toBeNull();
        expect(debitWalletTransaction.value).toBe(operation.value);
        expect(debitWalletTransaction.operation.id).toBe(operation.id);
        expect(debitWalletTransaction.transactionType).toBe(
          WalletAccountTransactionType.DEBIT,
        );
        expect(debitWalletTransaction.previousBalance).toBe(previousBalance1);
        expect(debitWalletTransaction.updatedBalance).toBe(updatedBalance1);

        expect(debitWalletAccount).not.toBeNull();
        expect(debitWalletAccount.pendingAmount).toBe(
          walletAccount1.pendingAmount - operation.value,
        );
        expect(debitWalletAccount.balance).toBe(walletAccount1.balance);

        expect(creditWalletTransaction).not.toBeNull();
        expect(creditWalletTransaction.value).toBe(operation.value);
        expect(creditWalletTransaction.operation.id).toBe(operation.id);
        expect(creditWalletTransaction.transactionType).toBe(
          WalletAccountTransactionType.CREDIT,
        );
        expect(creditWalletTransaction.previousBalance).toBe(previousBalance2);
        expect(creditWalletTransaction.updatedBalance).toBe(updatedBalance2);

        expect(creditWalletAccount).not.toBeNull();
        expect(creditWalletAccount.pendingAmount).toBe(
          walletAccount2.pendingAmount,
        );
        expect(creditWalletAccount.balance).toBe(
          walletAccount2.balance + operation.value,
        );

        const updatedWalletAccount1 = await WalletAccountModel.findOne({
          where: { id: walletAccount1.id },
        });

        expect(updatedWalletAccount1).not.toBeNull();
        expect(updatedWalletAccount1.balance).toBe(walletAccount1.balance);
        expect(updatedWalletAccount1.pendingAmount).toBe(
          walletAccount1.pendingAmount - operation.value,
        );

        const updatedWalletAccount2 = await WalletAccountModel.findOne({
          where: { id: walletAccount2.id },
        });

        expect(updatedWalletAccount2).not.toBeNull();
        expect(updatedWalletAccount2.balance).toBe(
          walletAccount2.balance + operation.value,
        );
        expect(updatedWalletAccount2.pendingAmount).toBe(
          walletAccount2.pendingAmount,
        );

        const walletAccountTransaction1 =
          await WalletAccountTransactionModel.findOne({
            where: {
              operationId: operation.id,
              walletAccountId: walletAccount1.id,
            },
          });

        expect(walletAccountTransaction1).not.toBeNull();
        expect(walletAccountTransaction1.value).toBe(operation.value);
        expect(walletAccountTransaction1.previousBalance).toBe(
          previousBalance1,
        );
        expect(walletAccountTransaction1.updatedBalance).toBe(updatedBalance1);
        expect(walletAccountTransaction1.transactionType).toBe(
          WalletAccountTransactionType.DEBIT,
        );

        const walletAccountTransaction2 =
          await WalletAccountTransactionModel.findOne({
            where: {
              operationId: operation.id,
              walletAccountId: walletAccount2.id,
            },
          });

        expect(walletAccountTransaction2).not.toBeNull();
        expect(walletAccountTransaction2.value).toBe(operation.value);
        expect(walletAccountTransaction2.previousBalance).toBe(
          previousBalance2,
        );
        expect(walletAccountTransaction2.updatedBalance).toBe(updatedBalance2);
        expect(walletAccountTransaction2.transactionType).toBe(
          WalletAccountTransactionType.CREDIT,
        );
      });

      it(`TC0004 - Should accept N owner's operations successfully`, async () => {
        const currency = await createCurrency();
        const { user, walletAccount } = await createUser(currency);
        const transactionType = await createTransactionType();

        const times = 10;
        const value = 1000;

        let operations = [];

        for (let i = 0; i < times; i++) {
          operations.push(
            createOperation({
              currency,
              transactionType,
              owner: user,
              ownerWalletAccount: walletAccount,
              value,
              state: OperationState.PENDING,
            }),
          );
        }

        operations = await Promise.all(operations);

        let executedOperations = await Promise.all(
          operations.map((operation) => executeUseCase(operation.id)),
        );

        executedOperations = executedOperations.sort((a, b) => {
          const aDate = a.debitWalletAccountTransaction.createdAt.getTime();
          const bDate = b.debitWalletAccountTransaction.createdAt.getTime();
          return aDate - bDate;
        });

        let previousBalance =
          walletAccount.balance + walletAccount.pendingAmount;

        for (const executedOperation of executedOperations) {
          const {
            operation: acceptedOperation,
            debitWalletAccountTransaction: debitWalletTransaction,
          } = executedOperation;
          const updatedBalance = previousBalance - value;

          expect(acceptedOperation).not.toBeNull();
          expect(acceptedOperation.state).toBe(OperationState.ACCEPTED);

          expect(debitWalletTransaction).not.toBeNull();
          expect(debitWalletTransaction.value).toBe(value);
          expect(debitWalletTransaction.operation.id).toBe(
            acceptedOperation.id,
          );
          expect(debitWalletTransaction.transactionType).toBe(
            WalletAccountTransactionType.DEBIT,
          );
          expect(debitWalletTransaction.previousBalance).toBe(previousBalance);
          expect(debitWalletTransaction.updatedBalance).toBe(updatedBalance);

          const walletAccountTransaction =
            await WalletAccountTransactionModel.findOne({
              where: {
                operationId: acceptedOperation.id,
              },
            });

          expect(walletAccountTransaction).not.toBeNull();
          expect(walletAccountTransaction.value).toBe(value);
          expect(walletAccountTransaction.previousBalance).toBe(
            previousBalance,
          );
          expect(walletAccountTransaction.updatedBalance).toBe(updatedBalance);
          expect(walletAccountTransaction.transactionType).toBe(
            WalletAccountTransactionType.DEBIT,
          );

          previousBalance = updatedBalance;
        }
        expect(mockAcceptedOperationEventEmitter).toHaveBeenCalledTimes(times);

        const updatedWalletAccount = await WalletAccountModel.findOne({
          where: { id: walletAccount.id },
        });

        expect(updatedWalletAccount).not.toBeNull();
        expect(updatedWalletAccount.balance).toBe(walletAccount.balance);
        expect(updatedWalletAccount.pendingAmount).toBe(
          walletAccount.pendingAmount - times * value,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0005 - Should not accept operation without operation id', async () => {
        await expect(executeUseCase(null)).rejects.toThrow(
          MissingDataException,
        );
        expect(mockAcceptedOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0006 - Should not accept operation without valid operation id', async () => {
        await expect(executeUseCase(faker.datatype.uuid())).rejects.toThrow(
          OperationNotFoundException,
        );
        expect(mockAcceptedOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0007 - Should not create operation without a valid owner info description', async () => {
        const currency = await createCurrency();
        const { user, walletAccount } = await createUser(currency);
        const transactionType = await createTransactionType();
        const operation = await createOperation({
          currency,
          transactionType,
          owner: user,
          ownerWalletAccount: walletAccount,
          value: 1000,
          state: OperationState.ACCEPTED,
        });

        await expect(executeUseCase(operation.id)).rejects.toThrow(
          OperationInvalidStateException,
        );
        expect(mockAcceptedOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0008 - Should not create operation with owner wallet account not found', async () => {
        const currency = await createCurrency();
        const { user } = await createUser(currency, false);
        const transactionType = await createTransactionType();
        const operation = await createOperation({
          currency,
          transactionType,
          owner: user,
          ownerWalletAccount: new WalletAccountEntity({ id: 0 }),
          value: 1000,
          state: OperationState.PENDING,
        });

        await expect(executeUseCase(operation.id)).rejects.toThrow(
          WalletAccountNotFoundException,
        );
        expect(mockAcceptedOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0009 - Should not create operation with owner wallet account not active', async () => {
        const currency = await createCurrency();
        const { user, walletAccount } = await createUser(
          currency,
          true,
          {},
          WalletAccountState.DEACTIVATE,
        );
        const transactionType = await createTransactionType();
        const operation = await createOperation({
          currency,
          transactionType,
          owner: user,
          ownerWalletAccount: walletAccount,
          value: 1000,
          state: OperationState.PENDING,
        });

        await expect(executeUseCase(operation.id)).rejects.toThrow(
          WalletAccountNotActiveException,
        );
        expect(mockAcceptedOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0010 - Should not create operation with wallet account not found', async () => {
        const currency = await createCurrency();
        const { user } = await createUser(currency);
        const transactionType = await createTransactionType();
        const operation = await createOperation({
          currency,
          transactionType,
          beneficiary: user,
          beneficiaryWalletAccount: new WalletAccountEntity({ id: 0 }),
          value: 1000,
          state: OperationState.PENDING,
        });

        await expect(executeUseCase(operation.id)).rejects.toThrow(
          WalletAccountNotFoundException,
        );
        expect(mockAcceptedOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0011 - Should not create operation with wallet account not found', async () => {
        const currency = await createCurrency();
        const { user, walletAccount } = await createUser(
          currency,
          true,
          {},
          WalletAccountState.DEACTIVATE,
        );
        const transactionType = await createTransactionType();
        const operation = await createOperation({
          currency,
          transactionType,
          beneficiary: user,
          beneficiaryWalletAccount: walletAccount,
          value: 1000,
          state: OperationState.PENDING,
        });

        await expect(executeUseCase(operation.id)).rejects.toThrow(
          WalletAccountNotActiveException,
        );
        expect(mockAcceptedOperationEventEmitter).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
