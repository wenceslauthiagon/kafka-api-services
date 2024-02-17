import { faker } from '@faker-js/faker/locale/pt_BR';
import { Sequelize } from 'sequelize';
import { createMock } from 'ts-auto-mock';
import { On, method } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  DATABASE_PROVIDER,
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  Currency,
  OperationState,
  TransactionType,
  TransactionTypeParticipants,
  TransactionTypeState,
  Wallet,
  WalletAccount,
  WalletAccountState,
  WalletAccountTransactionType,
  WalletState,
} from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';
import { OperationNotFoundException } from '@zro/operations/application';
import {
  AcceptOperationRequest,
  AcceptOperationResponse,
  OperationEventEmitterControllerInterface,
  OperationEventType,
} from '@zro/operations/interface';
import {
  WalletAccountModel,
  WalletAccountTransactionModel,
  OperationModel,
  TransactionTypeModel,
  CurrencyModel,
  WalletModel,
  OperationDatabaseRepository,
  WalletAccountTransactionDatabaseRepository,
  WalletAccountDatabaseRepository,
  AcceptOperationMicroserviceController,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import {
  CurrencyFactory,
  WalletFactory,
  WalletAccountFactory,
  TransactionTypeFactory,
  OperationFactory,
} from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';
import { KafkaContext } from '@nestjs/microservices';

describe('Testing accept operation controller.', () => {
  let controller: AcceptOperationMicroserviceController;
  let sequelize: Sequelize;
  let module: TestingModule;

  const operationEventEmitter: OperationEventEmitterControllerInterface =
    createMock<OperationEventEmitterControllerInterface>();
  const mockEmitOperationEventEmitter: jest.Mock = On(
    operationEventEmitter,
  ).get(method((mock) => mock.emitOperationEvent));

  const createCurrency = async (tag = 'REAL'): Promise<CurrencyModel> => {
    const found = await CurrencyModel.findOne({ where: { tag } });

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

  const executeController = async (
    id: string,
  ): Promise<AcceptOperationResponse> => {
    const transaction = await sequelize.transaction();

    try {
      const operationRepository = new OperationDatabaseRepository(transaction);
      const walletAccountRepository = new WalletAccountDatabaseRepository(
        transaction,
      );
      const walletAccountTransactionRepository =
        new WalletAccountTransactionDatabaseRepository(transaction);

      const message: AcceptOperationRequest = {
        id,
      };

      const operation = await controller.execute(
        walletAccountTransactionRepository,
        walletAccountRepository,
        operationRepository,
        operationEventEmitter,
        logger,
        message,
        ctx,
      );

      await transaction.commit();

      return operation?.value;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  beforeEach(jest.resetAllMocks);

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<AcceptOperationMicroserviceController>(
      AcceptOperationMicroserviceController,
    );
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

        const response = await executeController(operation.id);

        const value = operation.value;
        const previousBalance =
          walletAccount.balance + walletAccount.pendingAmount;
        const updatedBalance = previousBalance - value;

        const {
          operation: acceptedOperation,
          debitWalletAccount: debitWalletAccount,
          debitWalletAccountTransaction: debitWalletTransaction,
          creditWalletAccount: creditWalletAccount,
          creditWalletAccountTransaction: creditWalletTransaction,
        } = response;

        expect(acceptedOperation).not.toBeNull();
        expect(acceptedOperation.state).toBe(OperationState.ACCEPTED);
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(1);
        expect(mockEmitOperationEventEmitter.mock.calls[0][0]).toBe(
          OperationEventType.ACCEPTED,
        );
        expect(mockEmitOperationEventEmitter.mock.calls[0][1]).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].ownerOperation,
        ).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].ownerOperation.ownerId,
        ).toBe(user.id);
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].beneficiaryOperation,
        ).toBeNull();

        expect(debitWalletTransaction).not.toBeNull();
        expect(debitWalletTransaction.value).toBe(operation.value);
        expect(debitWalletTransaction.operationId).toBe(operation.id);
        expect(debitWalletTransaction.transactionType).toBe('DEBIT');
        expect(debitWalletTransaction.previousBalance).toBe(previousBalance);
        expect(debitWalletTransaction.updatedBalance).toBe(updatedBalance);

        expect(debitWalletAccount).not.toBeNull();
        expect(debitWalletAccount.pendingAmount).toBe(
          walletAccount.pendingAmount - operation.value,
        );
        expect(debitWalletAccount.balance).toBe(walletAccount.balance);

        expect(creditWalletAccount).toBeNull();
        expect(creditWalletTransaction).toBeNull();

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

      it('TC0002 - Should accept an beneficiary operation successfully', async () => {
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

        const response = await executeController(operation.id);

        const value = operation.value;
        const previousBalance =
          walletAccount.balance + walletAccount.pendingAmount;
        const updatedBalance = previousBalance + value;

        const {
          operation: acceptedOperation,
          debitWalletAccount: debitWalletAccount,
          debitWalletAccountTransaction: debitWalletTransaction,
          creditWalletAccount: creditWalletAccount,
          creditWalletAccountTransaction: creditWalletTransaction,
        } = response;

        expect(acceptedOperation).not.toBeNull();
        expect(acceptedOperation.state).toBe(OperationState.ACCEPTED);

        expect(debitWalletAccount).toBeNull();
        expect(debitWalletTransaction).toBeNull();

        expect(creditWalletTransaction).not.toBeNull();
        expect(creditWalletTransaction.value).toBe(operation.value);
        expect(creditWalletTransaction.operationId).toBe(operation.id);
        expect(creditWalletTransaction.transactionType).toBe('CREDIT');
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
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(1);
        expect(mockEmitOperationEventEmitter.mock.calls[0][0]).toBe(
          OperationEventType.ACCEPTED,
        );
        expect(mockEmitOperationEventEmitter.mock.calls[0][1]).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].ownerOperation,
        ).toBeNull();
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].beneficiaryOperation
            .beneficiaryId,
        ).toBe(user.id);

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

      it(`TC0003 - Should accept N owner's operations successfully`, async () => {
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

        let responses = await Promise.all(
          operations.map((operation) => executeController(operation.id)),
        );

        responses = responses.sort((a, b) => {
          const aDate = new Date(
            a.debitWalletAccountTransaction.createdAt,
          ).getTime();
          const bDate = new Date(
            b.debitWalletAccountTransaction.createdAt,
          ).getTime();
          return aDate - bDate;
        });

        let previousBalance =
          walletAccount.balance + walletAccount.pendingAmount;

        for (const response of responses) {
          const {
            operation: acceptedOperation,
            debitWalletAccountTransaction: debitWalletTransaction,
            creditWalletAccount: creditWalletAccount,
            creditWalletAccountTransaction: creditWalletTransaction,
          } = response;

          const updatedBalance = previousBalance - value;

          expect(acceptedOperation).not.toBeNull();
          expect(acceptedOperation.state).toBe(OperationState.ACCEPTED);

          expect(debitWalletTransaction).not.toBeNull();
          expect(debitWalletTransaction.value).toBe(value);
          expect(debitWalletTransaction.operationId).toBe(acceptedOperation.id);
          expect(debitWalletTransaction.transactionType).toBe('DEBIT');
          expect(debitWalletTransaction.previousBalance).toBe(previousBalance);
          expect(debitWalletTransaction.updatedBalance).toBe(updatedBalance);

          expect(creditWalletAccount).toBeNull();
          expect(creditWalletTransaction).toBeNull();

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
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(times);

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
      it('TC0004 - Should not accept an owner operation with invalid operation id format', async () => {
        await expect(() => executeController('XXXXX')).rejects.toThrow(
          InvalidDataFormatException,
        );
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0005 - Should not create an owner operation with invalid onwer wallet account id', async () => {
        const currency = await createCurrency();
        const { user, walletAccount } = await createUser(currency);
        const transactionType = await createTransactionType();
        await createOperation({
          currency,
          transactionType,
          owner: user,
          ownerWalletAccount: walletAccount,
          value: 1000,
          state: OperationState.PENDING,
        });

        const operationId = faker.datatype.uuid();

        await expect(() => executeController(operationId)).rejects.toThrow(
          OperationNotFoundException,
        );
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
