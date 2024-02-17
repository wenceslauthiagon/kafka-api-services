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
  WalletState,
} from '@zro/operations/domain';
import {
  RevertOperationUseCase,
  OperationNotFoundException,
  OperationInvalidStateException,
  OperationEventEmitter,
  WalletAccountNotFoundException,
} from '@zro/operations/application';
import {
  WalletAccountModel,
  OperationModel,
  TransactionTypeModel,
  CurrencyModel,
  WalletModel,
  OperationDatabaseRepository,
  WalletAccountDatabaseRepository,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { UserFactory } from '@zro/test/users/config';
import {
  CurrencyFactory,
  WalletFactory,
  WalletAccountFactory,
  TransactionTypeFactory,
  OperationFactory,
} from '@zro/test/operations/config';

describe('Testing revert operation use case.', () => {
  let sequelize: Sequelize;
  let module: TestingModule;

  const operationEventEmitter: OperationEventEmitter =
    createMock<OperationEventEmitter>();
  const mockRevertedOperationEventEmitter: jest.Mock = On(
    operationEventEmitter,
  ).get(method((mock) => mock.revertedOperation));

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
    { balance, pendingAmount }: any = {},
  ): Promise<CreatedUser> => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);
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
        balance: balance ?? 100000,
        pendingAmount: pendingAmount ?? 10000,
        state: WalletAccountState.ACTIVE,
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

  const executeUseCase = async (operationId: string) => {
    const transaction = await sequelize.transaction();

    try {
      const operationRepository = new OperationDatabaseRepository(transaction);
      const walletAccountRepository = new WalletAccountDatabaseRepository(
        transaction,
      );

      const revertOperationUseCase = new RevertOperationUseCase(
        logger,
        operationRepository,
        walletAccountRepository,
        operationEventEmitter,
      );

      const operation = await revertOperationUseCase.execute(operationId);

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

  describe('Revert operation', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should revert an owner operation successfully', async () => {
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

        const revertedOperation = await executeUseCase(operation.id);

        expect(revertedOperation).toBeDefined();
        expect(revertedOperation.state).toBe(OperationState.REVERTED);
        expect(mockRevertedOperationEventEmitter).toHaveBeenCalledTimes(1);

        const updatedOperation = await OperationModel.findOne({
          where: { id: operation.id },
        });

        expect(updatedOperation).toBeDefined();
        expect(updatedOperation.state).toBe(OperationState.REVERTED);

        const updatedWalletAccount = await WalletAccountModel.findOne({
          where: { id: walletAccount.id },
        });

        expect(updatedWalletAccount).toBeDefined();
        expect(updatedWalletAccount.balance).toBe(
          walletAccount.balance + operation.value,
        );
        expect(updatedWalletAccount.pendingAmount).toBe(
          walletAccount.pendingAmount - operation.value,
        );
      });

      it('TC0002 - Should revert a shared operation successfully', async () => {
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

        const revertedOperation = await executeUseCase(operation.id);

        expect(revertedOperation).toBeDefined();
        expect(revertedOperation.state).toBe(OperationState.REVERTED);
        expect(mockRevertedOperationEventEmitter).toHaveBeenCalledTimes(1);

        const updatedWalletAccount1 = await WalletAccountModel.findOne({
          where: { id: walletAccount1.id },
        });

        expect(updatedWalletAccount1).toBeDefined();
        expect(updatedWalletAccount1.balance).toBe(
          walletAccount1.balance + operation.value,
        );
        expect(updatedWalletAccount1.pendingAmount).toBe(
          walletAccount1.pendingAmount - operation.value,
        );

        const updatedWalletAccount2 = await WalletAccountModel.findOne({
          where: { id: walletAccount2.id },
        });

        expect(updatedWalletAccount2).toBeDefined();
        expect(updatedWalletAccount2.balance).toBe(walletAccount2.balance);
        expect(updatedWalletAccount2.pendingAmount).toBe(
          walletAccount2.pendingAmount,
        );
      });

      it(`TC0003 - Should revert N owner's operations successfully`, async () => {
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

        const executedOperations = await Promise.all(
          operations.map((operation) => executeUseCase(operation.id)),
        );

        for (const executedOperation of executedOperations) {
          const revertedOperation = executedOperation;

          expect(revertedOperation).toBeDefined();
          expect(revertedOperation.state).toBe(OperationState.REVERTED);
        }
        expect(mockRevertedOperationEventEmitter).toHaveBeenCalledTimes(times);

        const updatedWalletAccount = await WalletAccountModel.findOne({
          where: { id: walletAccount.id },
        });

        expect(updatedWalletAccount).toBeDefined();
        expect(updatedWalletAccount.balance).toBe(
          walletAccount.balance + times * value,
        );
        expect(updatedWalletAccount.pendingAmount).toBe(
          walletAccount.pendingAmount - times * value,
        );
      });

      it('TC0004 - Should revert a beneficiary operation successfully', async () => {
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

        const revertedOperation = await executeUseCase(operation.id);

        expect(revertedOperation).toBeDefined();
        expect(revertedOperation.state).toBe(OperationState.REVERTED);

        const updatedOperation = await OperationModel.findOne({
          where: { id: operation.id },
        });

        expect(updatedOperation).toBeDefined();
        expect(updatedOperation.state).toBe(OperationState.REVERTED);

        const updatedWalletAccount = await WalletAccountModel.findOne({
          where: { id: walletAccount.id },
        });

        expect(updatedWalletAccount).toBeDefined();
        expect(updatedWalletAccount.balance).toBe(walletAccount.balance);
        expect(updatedWalletAccount.pendingAmount).toBe(
          walletAccount.pendingAmount,
        );
        expect(mockRevertedOperationEventEmitter).toHaveBeenCalledTimes(1);
      });

      it('TC0005 - Should return a reverted operation successfully', async () => {
        const currency = await createCurrency();
        const { user, walletAccount } = await createUser(currency);
        const transactionType = await createTransactionType();
        const operation = await createOperation({
          currency,
          transactionType,
          beneficiary: user,
          beneficiaryWalletAccount: walletAccount,
          value: 1000,
          state: OperationState.REVERTED,
        });

        const revertedOperation = await executeUseCase(operation.id);

        expect(revertedOperation).toBeDefined();
        expect(revertedOperation.state).toBe(OperationState.REVERTED);
        expect(mockRevertedOperationEventEmitter).toHaveBeenCalledTimes(0);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0006 - Should not accept operation without operation id', async () => {
        await expect(executeUseCase(null)).rejects.toThrow(
          MissingDataException,
        );
        expect(mockRevertedOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0007 - Should not revert operation without valid operation id', async () => {
        await expect(executeUseCase(faker.datatype.uuid())).rejects.toThrow(
          OperationNotFoundException,
        );
        expect(mockRevertedOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0008 - Should not revert operation in invalid state 1', async () => {
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
        expect(mockRevertedOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0009 - Should not revert operation in invalid state 2', async () => {
        const currency = await createCurrency();
        const { user, walletAccount } = await createUser(currency);
        const transactionType = await createTransactionType();
        const operation = await createOperation({
          currency,
          transactionType,
          owner: user,
          ownerWalletAccount: walletAccount,
          value: 1000,
          state: OperationState.DECLINED,
        });

        await expect(executeUseCase(operation.id)).rejects.toThrow(
          OperationInvalidStateException,
        );
        expect(mockRevertedOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0010 - Should not revert operation with wallet account not found', async () => {
        const currency = await createCurrency();
        const { user } = await createUser(currency);
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
        expect(mockRevertedOperationEventEmitter).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
