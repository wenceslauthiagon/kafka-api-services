import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { QueryTypes, Sequelize } from 'sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MissingDataException,
  InvalidDataFormatException,
  DATABASE_PROVIDER,
  defaultLogger as logger,
  getMoment,
} from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  TransactionTypeParticipants,
  LimitTypeCheck,
  LimitTypePeriodStart,
  OperationState,
  TransactionTypeState,
  LimitType,
  Wallet,
  WalletAccount,
  OperationStreamQuotationEntity,
  PendingWalletAccountTransactionEntity,
  OperationEntity,
  CurrencyEntity,
  WalletState,
  WalletEntity,
  WalletAccountState,
  CurrencyState,
  UserLimit,
} from '@zro/operations/domain';
import {
  CreateOperationParticipant,
  CreateOperationUseCase as UseCase,
  DataException,
  TransactionTypeNotActiveException,
  TransactionTypeTagNotFoundException,
  NotEnoughFundsException,
  NotEnoughLimitException,
  ValueAboveMaxAmountLimitException,
  ValueUnderMinAmountLimitException,
  NotEnoughAvailableLimitException,
  ValueAboveMaxAmountNightlyLimitException,
  ValueUnderMinAmountNightlyLimitException,
  OperationEventEmitter,
  CurrencyNotFoundException,
  WalletNotFoundException,
  CurrencyNotActiveException,
  WalletNotActiveException,
  WalletAccountNotFoundException,
  WalletAccountNotActiveException,
  UserLimitEventEmitter,
} from '@zro/operations/application';
import { StreamQuotationNotFoundException } from '@zro/quotations/application';
import {
  WalletAccountModel,
  OperationModel,
  TransactionTypeModel,
  CurrencyModel,
  LimitTypeModel,
  GlobalLimitModel,
  UserLimitModel,
  WalletModel,
  CurrencyDatabaseRepository,
  GlobalLimitDatabaseRepository,
  LimitTypeDatabaseRepository,
  OperationDatabaseRepository,
  TransactionTypeDatabaseRepository,
  UserLimitDatabaseRepository,
  WalletDatabaseRepository,
  WalletAccountDatabaseRepository,
  WalletAccountCacheDatabaseRepository,
  OperationStreamQuotationRedisRepository,
  PendingWalletAccountTransactionRedisRepository,
  UserLimitTrackerDatabaseRepository,
  UserLimitTrackerModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import {
  CurrencyFactory,
  WalletFactory,
  WalletAccountFactory,
  TransactionTypeFactory,
  LimitTypeFactory,
  GlobalLimitFactory,
  UserLimitFactory,
  OperationFactory,
  OperationStreamQuotationFactory,
  PendingWalletAccountTransactionFactory,
  UserLimitTrackerFactory,
} from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

jest;
/**
 * Test create operation use case.
 */
describe('Testing create operation use case.', () => {
  let sequelize: Sequelize;
  let module: TestingModule;

  beforeEach(() => jest.resetAllMocks());

  const createMockRedis = () => {
    const pendingWalletAccountTransactionRepository: PendingWalletAccountTransactionRedisRepository =
      createMock<PendingWalletAccountTransactionRedisRepository>();
    const mockGetPendingWalletAccountTransaction: jest.Mock = On(
      pendingWalletAccountTransactionRepository,
    ).get(method((mock) => mock.getByWalletAccount));
    const mockUpdatePendingWalletAccountTransaction: jest.Mock = On(
      pendingWalletAccountTransactionRepository,
    ).get(method((mock) => mock.update));
    const mockCreatePendingWalletAccountTransaction: jest.Mock = On(
      pendingWalletAccountTransactionRepository,
    ).get(method((mock) => mock.create));

    const operationStreamQuotationRepository: OperationStreamQuotationRedisRepository =
      createMock<OperationStreamQuotationRedisRepository>();

    const mockGetOperationStreamQuotation: jest.Mock = On(
      operationStreamQuotationRepository,
    ).get(method((mock) => mock.getByBaseCurrencyAndQuoteCurrency));

    return {
      pendingWalletAccountTransactionRepository,
      operationStreamQuotationRepository,
      mockGetOperationStreamQuotation,
      mockGetPendingWalletAccountTransaction,
      mockUpdatePendingWalletAccountTransaction,
      mockCreatePendingWalletAccountTransaction,
    };
  };

  const operationEventEmitter: OperationEventEmitter =
    createMock<OperationEventEmitter>();
  const mockPendingOperationEventEmitter: jest.Mock = On(
    operationEventEmitter,
  ).get(method((mock) => mock.pendingOperation));

  const userlimitEventEmitter: UserLimitEventEmitter =
    createMock<UserLimitEventEmitter>();

  const createCurrency = async (
    tag = 'REAL',
    state = CurrencyState.ACTIVE,
    decimal = 2,
  ): Promise<CurrencyModel> => {
    return await CurrencyFactory.create<CurrencyModel>(CurrencyModel.name, {
      tag,
      state,
      decimal,
    });
  };

  const createTransactionType = async ({
    tag,
    participants,
    state,
  }: any = {}): Promise<TransactionTypeModel> => {
    const attrs: any = {
      tag: tag ?? faker.datatype.uuid(),
      state: state ?? TransactionTypeState.ACTIVE,
      participants: participants ?? TransactionTypeParticipants.OWNER,
    };

    return await TransactionTypeFactory.create<TransactionTypeModel>(
      TransactionTypeModel.name,
      attrs,
    );
  };

  const createLimitType = async (
    currency: CurrencyModel,
    transactionType: TransactionTypeModel,
    { tag, periodStart, check }: any = {},
  ): Promise<LimitTypeModel> => {
    const attrs: any = {
      tag: tag ?? transactionType.tag,
      periodStart: periodStart ?? LimitTypePeriodStart.DATE,
      check: check ?? LimitTypeCheck.OWNER,
      currencyId: currency.id,
    };

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      attrs,
    );

    await TransactionTypeModel.update(
      { limitTypeId: limitType.id },
      { where: { tag: transactionType.tag } },
    );

    return limitType;
  };

  const createGlobalLimit = async (
    limitType: LimitTypeModel,
    {
      nightlyLimit,
      dailyLimit,
      monthlyLimit,
      yearlyLimit,
      maxAmount,
      minAmount,
      userNightlyLimit,
      userDailyLimit,
      userMonthlyLimit,
      userYearlyLimit,
      nighttimeStart,
      nighttimeEnd,
    }: any = {},
  ): Promise<GlobalLimitModel> => {
    const attrs: any = {
      nightlyLimit: nightlyLimit ?? 10000,
      dailyLimit: dailyLimit ?? 10000,
      monthlyLimit: monthlyLimit ?? 20000,
      yearlyLimit: yearlyLimit ?? 30000,
      maxAmount: maxAmount ?? null,
      minAmount: minAmount ?? null,
      userNightlyLimit: userNightlyLimit ?? null,
      userDailyLimit: userDailyLimit ?? null,
      userMonthlyLimit: userMonthlyLimit ?? null,
      userYearlyLimit: userYearlyLimit ?? null,
      nighttimeStart: nighttimeStart ?? '20:00',
      nighttimeEnd: nighttimeEnd ?? '06:00',
    };

    return GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      ...attrs,
    });
  };

  const createUserLimit = async (
    user: User,
    limitType: LimitType,
    {
      nightlyLimit,
      dailyLimit,
      monthlyLimit,
      yearlyLimit,
      maxAmount,
      minAmount,
      maxAmountNightly,
      minAmountNightly,
      userMaxAmount,
      userMinAmount,
      userMaxAmountNightly,
      userMinAmountNightly,
      userNightlyLimit,
      userDailyLimit,
      userMonthlyLimit,
      userYearlyLimit,
      nighttimeStart,
      nighttimeEnd,
      creditBalance,
    }: any = {},
  ): Promise<UserLimitModel> => {
    const attrs: any = {
      nightlyLimit: nightlyLimit ?? 10000,
      dailyLimit: dailyLimit ?? 10000,
      monthlyLimit: monthlyLimit ?? 20000,
      yearlyLimit: yearlyLimit ?? 30000,
      maxAmount: maxAmount ?? null,
      minAmount: minAmount ?? null,
      maxAmountNightly: maxAmountNightly ?? null,
      minAmountNightly: minAmountNightly ?? null,
      userMaxAmount: userMaxAmount ?? null,
      userMinAmount: userMinAmount ?? null,
      userMaxAmountNightly: userMaxAmountNightly ?? null,
      userMinAmountNightly: userMinAmountNightly ?? null,
      userNightlyLimit: userNightlyLimit ?? null,
      userDailyLimit: userDailyLimit ?? null,
      userMonthlyLimit: userMonthlyLimit ?? null,
      userYearlyLimit: userYearlyLimit ?? null,
      nighttimeStart: nighttimeStart ?? '20:00',
      nighttimeEnd: nighttimeEnd ?? '06:00',
      creditBalance: creditBalance ?? 0,
    };

    return UserLimitFactory.create<UserLimitModel>(UserLimitModel.name, {
      userId: user.id,
      limitTypeId: limitType.id,
      ...attrs,
    });
  };

  const createUserLimitTracker = async (
    userLimit: UserLimit,
    limitType: LimitType,
    {
      usedDailyLimit,
      usedMonthlyLimit,
      usedAnnualLimit,
      usedNightlyLimit,
      updatedAt,
    }: any = {},
  ): Promise<UserLimitTrackerModel> => {
    const attrs: any = {
      userLimitId: userLimit.id,
      periodStart: limitType.periodStart,
      usedDailyLimit: usedDailyLimit ?? 0,
      usedMonthlyLimit: usedMonthlyLimit ?? 0,
      usedAnnualLimit: usedAnnualLimit ?? 0,
      usedNightlyLimit: usedNightlyLimit ?? 0,
    };

    const userLimitTracker =
      await UserLimitTrackerFactory.create<UserLimitTrackerModel>(
        UserLimitTrackerModel.name,
        {
          ...attrs,
        },
      );

    // Force updatedAt to update.
    if (updatedAt) {
      const sql = `
      UPDATE users_limits_tracker
      SET updated_at = '${updatedAt}'
      WHERE id='${userLimitTracker.id}'
      `;

      try {
        await sequelize.query(sql, {
          type: QueryTypes.UPDATE,
        });
      } catch (e) {
        console.log(e);
      }
    }

    return userLimitTracker;
  };

  interface CreatedUser {
    user: User;
    wallet: Wallet;
    walletAccount: WalletAccount;
  }

  interface CreatedSameUser {
    user: User;
    wallet: Wallet;
    walletAccounts: WalletAccount[];
  }

  const createUser = async (
    currency: CurrencyModel,
    { balance, pendingAmount }: any = {},
    walletState = WalletState.ACTIVE,
    createWalletAccount = true,
    walletAccountState = WalletAccountState.ACTIVE,
  ): Promise<CreatedUser> => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);
    const wallet = await WalletFactory.create<WalletModel>(WalletModel.name, {
      userId: user.id,
      userUUID: user.uuid,
      state: walletState,
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

    return { user, wallet, walletAccount: walletAccount.toDomain() };
  };

  const createSameUser = async (
    currencies: CurrencyModel[],
    { balance, pendingAmount }: any = {},
  ): Promise<CreatedSameUser> => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);
    const wallet = await WalletFactory.create<WalletModel>(WalletModel.name, {
      userId: user.id,
      userUUID: user.uuid,
      state: WalletState.ACTIVE,
    });

    const walletAccounts: WalletAccount[] = [];

    for (const currency of currencies) {
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountModel>(
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

      walletAccounts.push(walletAccount.toDomain());
    }

    return { user, wallet, walletAccounts };
  };

  const {
    pendingWalletAccountTransactionRepository,
    operationStreamQuotationRepository,
    mockGetOperationStreamQuotation,
    mockGetPendingWalletAccountTransaction,
    mockUpdatePendingWalletAccountTransaction,
    mockCreatePendingWalletAccountTransaction,
  } = createMockRedis();

  const executeUseCase = async ({
    ownerInfo,
    beneficiaryInfo,
    transactionTypeTag,
  }: {
    ownerInfo?: CreateOperationParticipant;
    beneficiaryInfo?: CreateOperationParticipant;
    transactionTypeTag?: string;
  }) => {
    const transaction = await sequelize.transaction();

    try {
      const transactionTypeRepository = new TransactionTypeDatabaseRepository(
        transaction,
      );
      const currencyRepository = new CurrencyDatabaseRepository(transaction);
      const walletRepository = new WalletDatabaseRepository(transaction);
      const walletAccountRepository = new WalletAccountDatabaseRepository(
        transaction,
      );
      const operationRepository = new OperationDatabaseRepository(transaction);
      const limitTypeRepository = new LimitTypeDatabaseRepository(transaction);
      const userLimitRepository = new UserLimitDatabaseRepository(transaction);
      const globalLimitRepository = new GlobalLimitDatabaseRepository(
        transaction,
      );
      const walletAccountCacheRepository =
        new WalletAccountCacheDatabaseRepository(transaction);
      const userLimitTrackerRepository = new UserLimitTrackerDatabaseRepository(
        transaction,
      );

      const operationSymbolCurrencyReal = 'BRL';
      const pendingWalletAccountTransactionTTL = 6000000;

      const createOperationUseCase = new UseCase(
        logger,
        transactionTypeRepository,
        currencyRepository,
        walletRepository,
        walletAccountRepository,
        operationRepository,
        limitTypeRepository,
        userLimitRepository,
        globalLimitRepository,
        walletAccountCacheRepository,
        operationStreamQuotationRepository,
        pendingWalletAccountTransactionRepository,
        operationEventEmitter,
        operationSymbolCurrencyReal,
        pendingWalletAccountTransactionTTL,
        userlimitEventEmitter,
        userLimitTrackerRepository,
      );

      const operation = await createOperationUseCase.execute(
        transactionTypeTag,
        ownerInfo,
        beneficiaryInfo,
      );

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

  afterEach(async () => {
    CurrencyModel.truncate({
      cascade: true,
    });
    TransactionTypeModel.truncate({
      cascade: true,
    });
    UserLimitModel.truncate({
      cascade: true,
    });
    UserLimitTrackerModel.truncate();
    GlobalLimitModel.truncate({
      cascade: true,
    });
    LimitTypeModel.truncate({
      cascade: true,
    });
    OperationModel.truncate({
      cascade: true,
    });
    WalletAccountModel.truncate();
    WalletModel.truncate();
  });

  describe('Create operation', () => {
    describe('With valid parameters', () => {
      it('TC1000 - Should create an owner operation successfully', async () => {
        const currency = await createCurrency();
        const { user, wallet, walletAccount } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);
        try {
          const ownerInfo: CreateOperationParticipant = {
            operation: new OperationEntity({ id: faker.datatype.uuid() }),
            wallet,
            currency,
            rawValue: 1000,
            fee: 0,
            description: 'Send PIX',
          };

          const { ownerOperation, beneficiaryOperation } = await executeUseCase(
            { ownerInfo, transactionTypeTag: transactionType.tag },
          );

          const value = ownerInfo.rawValue + ownerInfo.fee;

          expect(ownerOperation).not.toBeNull();
          expect(beneficiaryOperation).toBeNull();

          expect(ownerOperation.id).toBe(ownerInfo.operation.id);
          expect(ownerOperation.rawValue).toBe(ownerInfo.rawValue);
          expect(ownerOperation.value).toBe(value);
          expect(ownerOperation.fee).toBe(ownerInfo.fee);
          expect(ownerOperation.description).toBe(ownerInfo.description);
          expect(ownerOperation.transactionType.id).toBe(transactionType.id);
          expect(ownerOperation.currency.id).toBe(currency.id);
          expect(ownerOperation.operationRef).toBeNull();
          expect(ownerOperation.state).toBe(OperationState.PENDING);
          expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);

          expect(ownerOperation.owner).not.toBeNull();
          expect(ownerOperation.ownerWalletAccount).not.toBeNull();
          expect(ownerOperation.beneficiary).toBeNull();
          expect(ownerOperation.beneficiaryWalletAccount).toBeNull();

          expect(ownerOperation.owner.id).toBe(user.id);
          expect(ownerOperation.ownerWalletAccount.id).toBe(walletAccount.id);

          const createdOwnerOperation = await OperationModel.findOne({
            where: { id: ownerInfo.operation.id },
          });

          expect(createdOwnerOperation).not.toBeNull();
          expect(createdOwnerOperation.rawValue).toBe(ownerInfo.rawValue);
          expect(createdOwnerOperation.value).toBe(value);
          expect(createdOwnerOperation.fee).toBe(ownerInfo.fee);
          expect(createdOwnerOperation.description).toBe(ownerInfo.description);
          expect(createdOwnerOperation.transactionTypeId).toBe(
            transactionType.id,
          );
          expect(createdOwnerOperation.currencyId).toBe(currency.id);
          expect(createdOwnerOperation.operationRefId).toBeNull();
          expect(createdOwnerOperation.state).toBe(OperationState.PENDING);

          expect(createdOwnerOperation.ownerId).not.toBeNull();
          expect(createdOwnerOperation.ownerWalletAccountId).not.toBeNull();
          expect(createdOwnerOperation.beneficiaryId).not.toBeNull();
          expect(
            createdOwnerOperation.beneficiaryWalletAccountId,
          ).not.toBeNull();

          expect(createdOwnerOperation.ownerId).toBe(user.id);
          expect(createdOwnerOperation.ownerWalletAccountId).toBe(
            walletAccount.id,
          );
          expect(createdOwnerOperation.beneficiaryId).toBe(0);
          expect(createdOwnerOperation.beneficiaryWalletAccountId).toBe(0);
          expect(createdOwnerOperation.ownerRequestedRawValue).toBeNull();
          expect(createdOwnerOperation.ownerRequestedFee).toBeNull();

          const updatedWalletAccount = await WalletAccountModel.findOne({
            where: { id: walletAccount.id },
          });

          expect(updatedWalletAccount).not.toBeNull();
          expect(updatedWalletAccount.balance).toBe(
            walletAccount.balance - value,
          );
          expect(updatedWalletAccount.pendingAmount).toBe(
            walletAccount.pendingAmount + value,
          );
        } catch (error) {
          throw error;
        }
      });

      it('TC1001 - Should create a beneficiary operation successfully', async () => {
        const currency = await createCurrency();
        const { user, wallet, walletAccount } = await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BENEFICIARY,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        const { ownerOperation, beneficiaryOperation } = await executeUseCase({
          beneficiaryInfo,
          transactionTypeTag: transactionType.tag,
        });

        const value = beneficiaryInfo.rawValue - beneficiaryInfo.fee;

        expect(ownerOperation).toBeNull();
        expect(beneficiaryOperation).not.toBeNull();

        expect(beneficiaryOperation.id).toBe(beneficiaryInfo.operation.id);
        expect(beneficiaryOperation.rawValue).toBe(beneficiaryInfo.rawValue);
        expect(beneficiaryOperation.value).toBe(value);
        expect(beneficiaryOperation.fee).toBe(beneficiaryInfo.fee);
        expect(beneficiaryOperation.description).toBe(
          beneficiaryInfo.description,
        );
        expect(beneficiaryOperation.transactionType.id).toBe(
          transactionType.id,
        );
        expect(beneficiaryOperation.currency.id).toBe(currency.id);
        expect(beneficiaryOperation.operationRef).toBeNull();
        expect(beneficiaryOperation.state).toBe(OperationState.PENDING);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);

        expect(beneficiaryOperation.owner).toBeNull();
        expect(beneficiaryOperation.ownerWalletAccount).toBeNull();
        expect(beneficiaryOperation.beneficiary).not.toBeNull();
        expect(beneficiaryOperation.beneficiaryWalletAccount).not.toBeNull();

        expect(beneficiaryOperation.beneficiary.id).toBe(user.id);
        expect(beneficiaryOperation.beneficiaryWalletAccount.id).toBe(
          walletAccount.id,
        );

        const createdBeneficiaryOperation = await OperationModel.findOne({
          where: { id: beneficiaryInfo.operation.id },
        });

        expect(createdBeneficiaryOperation).not.toBeNull();
        expect(createdBeneficiaryOperation.rawValue).toBe(
          beneficiaryInfo.rawValue,
        );
        expect(createdBeneficiaryOperation.value).toBe(value);
        expect(createdBeneficiaryOperation.fee).toBe(beneficiaryInfo.fee);
        expect(createdBeneficiaryOperation.description).toBe(
          beneficiaryInfo.description,
        );
        expect(createdBeneficiaryOperation.transactionTypeId).toBe(
          transactionType.id,
        );
        expect(createdBeneficiaryOperation.currencyId).toBe(currency.id);
        expect(createdBeneficiaryOperation.operationRefId).toBeNull();
        expect(createdBeneficiaryOperation.state).toBe(OperationState.PENDING);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);

        expect(createdBeneficiaryOperation.ownerId).not.toBeNull();
        expect(createdBeneficiaryOperation.ownerWalletAccountId).not.toBeNull();
        expect(createdBeneficiaryOperation.beneficiaryId).not.toBeNull();
        expect(
          createdBeneficiaryOperation.beneficiaryWalletAccountId,
        ).not.toBeNull();

        expect(createdBeneficiaryOperation.ownerId).toBe(0);
        expect(createdBeneficiaryOperation.ownerWalletAccountId).toBe(0);
        expect(createdBeneficiaryOperation.beneficiaryId).toBe(user.id);
        expect(createdBeneficiaryOperation.beneficiaryWalletAccountId).toBe(
          walletAccount.id,
        );
        expect(createdBeneficiaryOperation.ownerRequestedRawValue).toBeNull();
        expect(createdBeneficiaryOperation.ownerRequestedFee).toBeNull();

        const updatedWalletAccount = await WalletAccountModel.findOne({
          where: { id: walletAccount.id },
        });

        expect(updatedWalletAccount).not.toBeNull();
        expect(updatedWalletAccount.balance).toBe(walletAccount.balance);
        expect(updatedWalletAccount.pendingAmount).toBe(
          walletAccount.pendingAmount,
        );
      });

      it('TC1002 - Should create a shared operation successfully', async () => {
        const currency = await createCurrency();
        const { user: user1, walletAccount: walletAccount1 } =
          await createUser(currency);
        const { user: user2, walletAccount: walletAccount2 } =
          await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BOTH,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user1, limitType);
        await createUserLimit(user2, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet: walletAccount1.wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet: walletAccount2.wallet,
          currency,
          rawValue: 2000,
          fee: 0,
          description: 'Send PIX',
        };

        const { ownerOperation, beneficiaryOperation } = await executeUseCase({
          ownerInfo,
          beneficiaryInfo,
          transactionTypeTag: transactionType.tag,
        });

        const value = ownerInfo.rawValue + ownerInfo.fee;

        expect(ownerOperation).not.toBeNull();
        expect(beneficiaryOperation).not.toBeNull();

        expect(ownerOperation.id).toBe(beneficiaryOperation.id);

        expect(ownerOperation.id).toBe(ownerInfo.operation.id);
        expect(ownerOperation.rawValue).toBe(ownerInfo.rawValue);
        expect(ownerOperation.value).toBe(value);
        expect(ownerOperation.fee).toBe(ownerInfo.fee);
        expect(ownerOperation.description).toBe(ownerInfo.description);
        expect(ownerOperation.transactionType.id).toBe(transactionType.id);
        expect(ownerOperation.currency.id).toBe(currency.id);
        expect(ownerOperation.operationRef).toBeNull();
        expect(ownerOperation.state).toBe(OperationState.PENDING);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);

        expect(ownerOperation.owner).not.toBeNull();
        expect(ownerOperation.ownerWalletAccount).not.toBeNull();
        expect(ownerOperation.beneficiary).not.toBeNull();
        expect(ownerOperation.beneficiaryWalletAccount).not.toBeNull();

        expect(ownerOperation.owner.id).toBe(user1.id);
        expect(ownerOperation.ownerWalletAccount.id).toBe(walletAccount1.id);
        expect(ownerOperation.beneficiary.id).toBe(user2.id);
        expect(ownerOperation.beneficiaryWalletAccount.id).toBe(
          walletAccount2.id,
        );

        const createdOwnerOperation = await OperationModel.findOne({
          where: { id: ownerInfo.operation.id },
        });

        expect(createdOwnerOperation).not.toBeNull();
        expect(createdOwnerOperation.rawValue).toBe(ownerInfo.rawValue);
        expect(createdOwnerOperation.value).toBe(value);
        expect(createdOwnerOperation.fee).toBe(ownerInfo.fee);
        expect(createdOwnerOperation.description).toBe(ownerInfo.description);
        expect(createdOwnerOperation.transactionTypeId).toBe(
          transactionType.id,
        );
        expect(createdOwnerOperation.currencyId).toBe(currency.id);
        expect(createdOwnerOperation.operationRefId).toBeNull();
        expect(createdOwnerOperation.state).toBe(OperationState.PENDING);

        expect(createdOwnerOperation.ownerId).not.toBeNull();
        expect(createdOwnerOperation.ownerWalletAccountId).not.toBeNull();
        expect(createdOwnerOperation.beneficiaryId).not.toBeNull();
        expect(createdOwnerOperation.beneficiaryWalletAccountId).not.toBeNull();

        expect(createdOwnerOperation.ownerId).toBe(user1.id);
        expect(createdOwnerOperation.ownerWalletAccountId).toBe(
          walletAccount1.id,
        );
        expect(createdOwnerOperation.beneficiaryId).toBe(user2.id);
        expect(createdOwnerOperation.beneficiaryWalletAccountId).toBe(
          walletAccount2.id,
        );
        expect(createdOwnerOperation.ownerRequestedRawValue).toBeNull();
        expect(createdOwnerOperation.ownerRequestedFee).toBeNull();

        const updatedWalletAccount1 = await WalletAccountModel.findOne({
          where: { id: walletAccount1.id },
        });

        expect(updatedWalletAccount1).not.toBeNull();
        expect(updatedWalletAccount1.balance).toBe(
          walletAccount1.balance - value,
        );
        expect(updatedWalletAccount1.pendingAmount).toBe(
          walletAccount1.pendingAmount + value,
        );

        const updatedWalletAccount2 = await WalletAccountModel.findOne({
          where: { id: walletAccount2.id },
        });

        expect(updatedWalletAccount2).not.toBeNull();
        expect(updatedWalletAccount2.balance).toBe(walletAccount2.balance);
        expect(updatedWalletAccount2.pendingAmount).toBe(
          walletAccount2.pendingAmount,
        );
      });

      it('TC1003 - Should create two independent operations successfully', async () => {
        const currency1 = await createCurrency();
        const currency2 = await createCurrency('BTC');
        const { user: user1, walletAccount: walletAccount1 } =
          await createUser(currency1);
        const { user: user2, walletAccount: walletAccount2 } =
          await createUser(currency2);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BOTH,
        });
        const limitType = await createLimitType(currency1, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user1, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet: walletAccount1.wallet,
          currency: currency1,
          rawValue: 1000,
          fee: 100,
          description: 'Conversion withdrawal',
        };

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet: walletAccount2.wallet,
          currency: currency2,
          rawValue: 50,
          fee: 10,
          description: 'Conversion deposit',
        };

        const { ownerOperation, beneficiaryOperation } = await executeUseCase({
          ownerInfo,
          beneficiaryInfo,
          transactionTypeTag: transactionType.tag,
        });

        const value1 = ownerInfo.rawValue + ownerInfo.fee;
        const value2 = beneficiaryInfo.rawValue - beneficiaryInfo.fee;

        expect(ownerOperation).not.toBeNull();
        expect(beneficiaryOperation).not.toBeNull();

        expect(ownerOperation.id).not.toBe(beneficiaryOperation.id);

        expect(ownerOperation.id).toBe(ownerInfo.operation.id);
        expect(ownerOperation.rawValue).toBe(ownerInfo.rawValue);
        expect(ownerOperation.value).toBe(value1);
        expect(ownerOperation.fee).toBe(ownerInfo.fee);
        expect(ownerOperation.description).toBe(ownerInfo.description);
        expect(ownerOperation.transactionType.id).toBe(transactionType.id);
        expect(ownerOperation.currency.id).toBe(currency1.id);
        expect(ownerOperation.operationRef).not.toBeNull();
        expect(ownerOperation.operationRef.id).toBe(beneficiaryOperation.id);
        expect(ownerOperation.state).toBe(OperationState.PENDING);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);

        expect(ownerOperation.owner).not.toBeNull();
        expect(ownerOperation.ownerWalletAccount).not.toBeNull();
        expect(ownerOperation.beneficiary).toBeNull();
        expect(ownerOperation.beneficiaryWalletAccount).toBeNull();

        expect(ownerOperation.owner.id).toBe(user1.id);
        expect(ownerOperation.ownerWalletAccount.id).toBe(walletAccount1.id);

        expect(beneficiaryOperation.id).toBe(beneficiaryInfo.operation.id);
        expect(beneficiaryOperation.rawValue).toBe(beneficiaryInfo.rawValue);
        expect(beneficiaryOperation.value).toBe(value2);
        expect(beneficiaryOperation.fee).toBe(beneficiaryInfo.fee);
        expect(beneficiaryOperation.description).toBe(
          beneficiaryInfo.description,
        );
        expect(beneficiaryOperation.transactionType.id).toBe(
          transactionType.id,
        );
        expect(beneficiaryOperation.currency.id).toBe(currency2.id);
        expect(beneficiaryOperation.operationRef).not.toBeNull();
        expect(beneficiaryOperation.operationRef.id).toBe(ownerOperation.id);
        expect(beneficiaryOperation.state).toBe(OperationState.PENDING);

        expect(beneficiaryOperation.owner).toBeNull();
        expect(beneficiaryOperation.ownerWalletAccount).toBeNull();
        expect(beneficiaryOperation.beneficiary).not.toBeNull();
        expect(beneficiaryOperation.beneficiaryWalletAccount).not.toBeNull();

        expect(beneficiaryOperation.beneficiary.id).toBe(user2.id);
        expect(beneficiaryOperation.beneficiaryWalletAccount.id).toBe(
          walletAccount2.id,
        );

        const createdOwnerOperation = await OperationModel.findOne({
          where: { id: ownerInfo.operation.id },
        });

        expect(createdOwnerOperation).not.toBeNull();
        expect(createdOwnerOperation.rawValue).toBe(ownerInfo.rawValue);
        expect(createdOwnerOperation.value).toBe(value1);
        expect(createdOwnerOperation.fee).toBe(ownerInfo.fee);
        expect(createdOwnerOperation.description).toBe(ownerInfo.description);
        expect(createdOwnerOperation.transactionTypeId).toBe(
          transactionType.id,
        );
        expect(createdOwnerOperation.currencyId).toBe(currency1.id);
        expect(createdOwnerOperation.operationRefId).toBe(
          beneficiaryOperation.id,
        );
        expect(createdOwnerOperation.state).toBe(OperationState.PENDING);

        expect(createdOwnerOperation.ownerId).not.toBeNull();
        expect(createdOwnerOperation.ownerWalletAccountId).not.toBeNull();
        expect(createdOwnerOperation.beneficiaryId).not.toBeNull();
        expect(createdOwnerOperation.beneficiaryWalletAccountId).not.toBeNull();

        expect(createdOwnerOperation.ownerId).toBe(user1.id);
        expect(createdOwnerOperation.ownerWalletAccountId).toBe(
          walletAccount1.id,
        );
        expect(createdOwnerOperation.beneficiaryId).toBe(0);
        expect(createdOwnerOperation.beneficiaryWalletAccountId).toBe(0);
        expect(createdOwnerOperation.ownerRequestedRawValue).toBeNull();
        expect(createdOwnerOperation.ownerRequestedFee).toBeNull();

        const updatedWalletAccount1 = await WalletAccountModel.findOne({
          where: { id: walletAccount1.id },
        });

        expect(updatedWalletAccount1).not.toBeNull();
        expect(updatedWalletAccount1.balance).toBe(
          walletAccount1.balance - value1,
        );
        expect(updatedWalletAccount1.pendingAmount).toBe(
          walletAccount1.pendingAmount + value1,
        );

        const createdBeneficiaryOperation = await OperationModel.findOne({
          where: { id: beneficiaryInfo.operation.id },
        });

        expect(createdBeneficiaryOperation).not.toBeNull();
        expect(createdBeneficiaryOperation.rawValue).toBe(
          beneficiaryInfo.rawValue,
        );
        expect(createdBeneficiaryOperation.value).toBe(value2);
        expect(createdBeneficiaryOperation.fee).toBe(beneficiaryInfo.fee);
        expect(createdBeneficiaryOperation.description).toBe(
          beneficiaryInfo.description,
        );
        expect(createdBeneficiaryOperation.transactionTypeId).toBe(
          transactionType.id,
        );
        expect(createdBeneficiaryOperation.currencyId).toBe(currency2.id);
        expect(createdBeneficiaryOperation.operationRefId).toBe(
          ownerOperation.id,
        );
        expect(createdBeneficiaryOperation.state).toBe(OperationState.PENDING);

        expect(createdBeneficiaryOperation.ownerId).not.toBeNull();
        expect(createdBeneficiaryOperation.ownerWalletAccountId).not.toBeNull();
        expect(createdBeneficiaryOperation.beneficiaryId).not.toBeNull();
        expect(
          createdBeneficiaryOperation.beneficiaryWalletAccountId,
        ).not.toBeNull();

        expect(createdBeneficiaryOperation.ownerId).toBe(0);
        expect(createdBeneficiaryOperation.ownerWalletAccountId).toBe(0);
        expect(createdBeneficiaryOperation.beneficiaryId).toBe(user2.id);
        expect(createdBeneficiaryOperation.beneficiaryWalletAccountId).toBe(
          walletAccount2.id,
        );
        expect(createdBeneficiaryOperation.ownerRequestedRawValue).toBeNull();
        expect(createdBeneficiaryOperation.ownerRequestedFee).toBeNull();

        const updatedWalletAccount2 = await WalletAccountModel.findOne({
          where: { id: walletAccount2.id },
        });

        expect(updatedWalletAccount2).not.toBeNull();
        expect(updatedWalletAccount2.balance).toBe(walletAccount2.balance);
        expect(updatedWalletAccount2.pendingAmount).toBe(
          walletAccount2.pendingAmount,
        );
      });

      it(`TC1004 - Should create N owner's operations successfully`, async () => {
        const currency = await createCurrency();
        const { user, wallet, walletAccount } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo = {
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        const times = 10;
        let operations = [];

        for (let i = 0; i < times; i++) {
          const info: CreateOperationParticipant = {
            ...ownerInfo,
            operation: new OperationEntity({ id: faker.datatype.uuid() }),
          };
          const operation = executeUseCase({
            ownerInfo: info,
            transactionTypeTag: transactionType.tag,
          });

          operations.push(operation);
        }

        operations = await Promise.all(operations);

        operations = operations.sort((a, b) => {
          const aDate = a.ownerOperation.createdAt.getTime();
          const bDate = b.ownerOperation.createdAt.getTime();
          return aDate - bDate;
        });

        const value = ownerInfo.rawValue + ownerInfo.fee;

        for (const operation of operations) {
          const { ownerOperation, beneficiaryOperation } = operation;

          expect(ownerOperation).not.toBeNull();
          expect(beneficiaryOperation).toBeNull();

          expect(ownerOperation.id).not.toBeNull();
          expect(ownerOperation.rawValue).toBe(ownerInfo.rawValue);
          expect(ownerOperation.value).toBe(value);
          expect(ownerOperation.fee).toBe(ownerInfo.fee);
          expect(ownerOperation.description).toBe(ownerInfo.description);
          expect(ownerOperation.transactionType.id).toBe(transactionType.id);
          expect(ownerOperation.currency.id).toBe(currency.id);
          expect(ownerOperation.state).toBe(OperationState.PENDING);
          expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(times);

          expect(ownerOperation.owner).not.toBeNull();
          expect(ownerOperation.ownerWalletAccount).not.toBeNull();
          expect(ownerOperation.beneficiary).toBeNull();
          expect(ownerOperation.beneficiaryWalletAccount).toBeNull();

          expect(ownerOperation.owner.id).toBe(user.id);
          expect(ownerOperation.ownerWalletAccount.id).toBe(walletAccount.id);

          const createdOwnerOperation = await OperationModel.findOne({
            where: { id: ownerOperation.id },
          });

          expect(createdOwnerOperation).not.toBeNull();
          expect(createdOwnerOperation.rawValue).toBe(ownerInfo.rawValue);
          expect(createdOwnerOperation.value).toBe(value);
          expect(createdOwnerOperation.fee).toBe(ownerInfo.fee);
          expect(createdOwnerOperation.description).toBe(ownerInfo.description);
          expect(createdOwnerOperation.transactionTypeId).toBe(
            transactionType.id,
          );
          expect(createdOwnerOperation.currencyId).toBe(currency.id);
          expect(createdOwnerOperation.operationRefId).toBeNull();
          expect(createdOwnerOperation.state).toBe(OperationState.PENDING);

          expect(createdOwnerOperation.ownerId).not.toBeNull();
          expect(createdOwnerOperation.ownerWalletAccountId).not.toBeNull();
          expect(createdOwnerOperation.beneficiaryId).not.toBeNull();
          expect(
            createdOwnerOperation.beneficiaryWalletAccountId,
          ).not.toBeNull();

          expect(createdOwnerOperation.ownerId).toBe(user.id);
          expect(createdOwnerOperation.ownerWalletAccountId).toBe(
            walletAccount.id,
          );
          expect(createdOwnerOperation.beneficiaryId).toBe(0);
          expect(createdOwnerOperation.beneficiaryWalletAccountId).toBe(0);
          expect(createdOwnerOperation.ownerRequestedRawValue).toBeNull();
          expect(createdOwnerOperation.ownerRequestedFee).toBeNull();
        }

        const updatedWalletAccount = await WalletAccountModel.findOne({
          where: { id: walletAccount.id },
        });

        expect(updatedWalletAccount).not.toBeNull();
        expect(updatedWalletAccount.balance).toBe(
          walletAccount.balance - times * value,
        );
        expect(updatedWalletAccount.pendingAmount).toBe(
          walletAccount.pendingAmount + times * value,
        );
      });

      it('TC1005 - Should create an owner operation without user limit successfully', async () => {
        const currency = await createCurrency();
        const { user, wallet, walletAccount } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        const { ownerOperation, beneficiaryOperation } = await executeUseCase({
          ownerInfo,
          transactionTypeTag: transactionType.tag,
        });

        const value = ownerInfo.rawValue + ownerInfo.fee;

        expect(ownerOperation).not.toBeNull();
        expect(beneficiaryOperation).toBeNull();

        expect(ownerOperation.id).toBe(ownerInfo.operation.id);
        expect(ownerOperation.rawValue).toBe(ownerInfo.rawValue);
        expect(ownerOperation.value).toBe(value);
        expect(ownerOperation.fee).toBe(ownerInfo.fee);
        expect(ownerOperation.description).toBe(ownerInfo.description);
        expect(ownerOperation.transactionType.id).toBe(transactionType.id);
        expect(ownerOperation.currency.id).toBe(currency.id);
        expect(ownerOperation.state).toBe(OperationState.PENDING);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);

        expect(ownerOperation.owner).not.toBeNull();
        expect(ownerOperation.ownerWalletAccount).not.toBeNull();
        expect(ownerOperation.beneficiary).toBeNull();
        expect(ownerOperation.beneficiaryWalletAccount).toBeNull();

        expect(ownerOperation.owner.id).toBe(user.id);
        expect(ownerOperation.ownerWalletAccount.id).toBe(walletAccount.id);

        const createdOwnerOperation = await OperationModel.findOne({
          where: { id: ownerInfo.operation.id },
        });

        expect(createdOwnerOperation).not.toBeNull();
        expect(createdOwnerOperation.rawValue).toBe(ownerInfo.rawValue);
        expect(createdOwnerOperation.value).toBe(value);
        expect(createdOwnerOperation.fee).toBe(ownerInfo.fee);
        expect(createdOwnerOperation.description).toBe(ownerInfo.description);
        expect(createdOwnerOperation.transactionTypeId).toBe(
          transactionType.id,
        );
        expect(createdOwnerOperation.currencyId).toBe(currency.id);
        expect(createdOwnerOperation.operationRefId).toBeNull();
        expect(createdOwnerOperation.state).toBe(OperationState.PENDING);

        expect(createdOwnerOperation.ownerId).not.toBeNull();
        expect(createdOwnerOperation.ownerWalletAccountId).not.toBeNull();
        expect(createdOwnerOperation.beneficiaryId).not.toBeNull();
        expect(createdOwnerOperation.beneficiaryWalletAccountId).not.toBeNull();

        expect(createdOwnerOperation.ownerId).toBe(user.id);
        expect(createdOwnerOperation.ownerWalletAccountId).toBe(
          walletAccount.id,
        );
        expect(createdOwnerOperation.beneficiaryId).toBe(0);
        expect(createdOwnerOperation.beneficiaryWalletAccountId).toBe(0);
        expect(createdOwnerOperation.ownerRequestedRawValue).toBeNull();
        expect(createdOwnerOperation.ownerRequestedFee).toBeNull();

        const updatedWalletAccount = await WalletAccountModel.findOne({
          where: { id: walletAccount.id },
        });

        expect(updatedWalletAccount).not.toBeNull();
        expect(updatedWalletAccount.balance).toBe(
          walletAccount.balance - value,
        );
        expect(updatedWalletAccount.pendingAmount).toBe(
          walletAccount.pendingAmount + value,
        );
      });

      it('TC1006 - Should create operation with enough used daily limit by date and reverted previous operations', async () => {
        const currency = await createCurrency();
        const { user, wallet, walletAccount } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 1500,
          monthlyLimit: 20000,
          yearlyLimit: 30000,
          maxAmount: null,
          minAmount: null,
        });

        await OperationFactory.create<OperationModel>(OperationModel.name, {
          rawValue: 1000,
          ownerId: user.id,
          fee: 10,
          state: OperationState.REVERTED,
        });

        await OperationFactory.create<OperationModel>(OperationModel.name, {
          rawValue: 1000,
          ownerId: user.id,
          fee: 10,
          state: OperationState.DECLINED,
        });

        await OperationFactory.create<OperationModel>(OperationModel.name, {
          rawValue: 1000,
          ownerId: user.id,
          fee: 10,
          state: OperationState.UNDONE,
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        const { ownerOperation } = await executeUseCase({
          ownerInfo,
          transactionTypeTag: transactionType.tag,
        });

        const value = ownerInfo.rawValue + ownerInfo.fee;

        expect(ownerOperation).not.toBeNull();

        expect(ownerOperation.id).toBe(ownerInfo.operation.id);
        expect(ownerOperation.rawValue).toBe(ownerInfo.rawValue);
        expect(ownerOperation.value).toBe(value);
        expect(ownerOperation.fee).toBe(ownerInfo.fee);
        expect(ownerOperation.description).toBe(ownerInfo.description);
        expect(ownerOperation.transactionType.id).toBe(transactionType.id);
        expect(ownerOperation.currency.id).toBe(currency.id);
        expect(ownerOperation.state).toBe(OperationState.PENDING);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);

        expect(ownerOperation.owner).not.toBeNull();
        expect(ownerOperation.ownerWalletAccount).not.toBeNull();
        expect(ownerOperation.beneficiary).toBeNull();
        expect(ownerOperation.beneficiaryWalletAccount).toBeNull();

        expect(ownerOperation.owner.id).toBe(user.id);
        expect(ownerOperation.ownerWalletAccount.id).toBe(walletAccount.id);

        const createdOwnerOperation = await OperationModel.findOne({
          where: { id: ownerInfo.operation.id },
        });

        expect(createdOwnerOperation).not.toBeNull();
        expect(createdOwnerOperation.rawValue).toBe(ownerInfo.rawValue);
        expect(createdOwnerOperation.value).toBe(value);
        expect(createdOwnerOperation.fee).toBe(ownerInfo.fee);
        expect(createdOwnerOperation.description).toBe(ownerInfo.description);
        expect(createdOwnerOperation.transactionTypeId).toBe(
          transactionType.id,
        );
        expect(createdOwnerOperation.currencyId).toBe(currency.id);
        expect(createdOwnerOperation.operationRefId).toBeNull();
        expect(createdOwnerOperation.state).toBe(OperationState.PENDING);

        expect(createdOwnerOperation.ownerId).not.toBeNull();
        expect(createdOwnerOperation.ownerWalletAccountId).not.toBeNull();
        expect(createdOwnerOperation.beneficiaryId).not.toBeNull();
        expect(createdOwnerOperation.beneficiaryWalletAccountId).not.toBeNull();

        expect(createdOwnerOperation.ownerId).toBe(user.id);
        expect(createdOwnerOperation.ownerWalletAccountId).toBe(
          walletAccount.id,
        );
        expect(createdOwnerOperation.beneficiaryId).toBe(0);
        expect(createdOwnerOperation.beneficiaryWalletAccountId).toBe(0);

        const updatedWalletAccount = await WalletAccountModel.findOne({
          where: { id: walletAccount.id },
        });

        expect(updatedWalletAccount).not.toBeNull();
        expect(updatedWalletAccount.balance).toBe(
          walletAccount.balance - value,
        );
        expect(updatedWalletAccount.pendingAmount).toBe(
          walletAccount.pendingAmount + value,
        );
      });

      it('TC1007 - Should create an owner operation when ownerAllowAvailableRawValue is TRUE and balance is GREATER than rawValue + fee successfully', async () => {
        const currency = await createCurrency();
        const { user, wallet, walletAccount } = await createUser(currency, {
          balance: 5000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);
        try {
          const ownerInfo: CreateOperationParticipant = {
            operation: new OperationEntity({ id: faker.datatype.uuid() }),
            wallet,
            currency,
            rawValue: 1000,
            fee: 0,
            description: 'Send PIX REFUND',
            ownerAllowAvailableRawValue: true,
          };

          const { ownerOperation, beneficiaryOperation } = await executeUseCase(
            { ownerInfo, transactionTypeTag: transactionType.tag },
          );

          const value = ownerInfo.rawValue + ownerInfo.fee;

          expect(ownerOperation).not.toBeNull();
          expect(beneficiaryOperation).toBeNull();

          expect(ownerOperation.id).toBe(ownerInfo.operation.id);
          expect(ownerOperation.rawValue).toBe(ownerInfo.rawValue);
          expect(ownerOperation.value).toBe(value);
          expect(ownerOperation.fee).toBe(ownerInfo.fee);
          expect(ownerOperation.description).toBe(ownerInfo.description);
          expect(ownerOperation.transactionType.id).toBe(transactionType.id);
          expect(ownerOperation.currency.id).toBe(currency.id);
          expect(ownerOperation.operationRef).toBeNull();
          expect(ownerOperation.state).toBe(OperationState.PENDING);

          expect(ownerOperation.owner).not.toBeNull();
          expect(ownerOperation.ownerWalletAccount).not.toBeNull();
          expect(ownerOperation.beneficiary).toBeNull();
          expect(ownerOperation.beneficiaryWalletAccount).toBeNull();

          expect(ownerOperation.owner.id).toBe(user.id);
          expect(ownerOperation.ownerWalletAccount.id).toBe(walletAccount.id);

          const createdOwnerOperation = await OperationModel.findOne({
            where: { id: ownerInfo.operation.id },
          });

          expect(createdOwnerOperation).not.toBeNull();
          expect(createdOwnerOperation.rawValue).toBe(ownerInfo.rawValue);
          expect(createdOwnerOperation.value).toBe(value);
          expect(createdOwnerOperation.fee).toBe(ownerInfo.fee);
          expect(createdOwnerOperation.description).toBe(ownerInfo.description);
          expect(createdOwnerOperation.transactionTypeId).toBe(
            transactionType.id,
          );
          expect(createdOwnerOperation.currencyId).toBe(currency.id);
          expect(createdOwnerOperation.operationRefId).toBeNull();
          expect(createdOwnerOperation.state).toBe(OperationState.PENDING);
          expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);

          expect(createdOwnerOperation.ownerId).not.toBeNull();
          expect(createdOwnerOperation.ownerWalletAccountId).not.toBeNull();
          expect(createdOwnerOperation.beneficiaryId).not.toBeNull();
          expect(
            createdOwnerOperation.beneficiaryWalletAccountId,
          ).not.toBeNull();

          expect(createdOwnerOperation.ownerId).toBe(user.id);
          expect(createdOwnerOperation.ownerWalletAccountId).toBe(
            walletAccount.id,
          );
          expect(createdOwnerOperation.beneficiaryId).toBe(0);
          expect(createdOwnerOperation.beneficiaryWalletAccountId).toBe(0);
          expect(createdOwnerOperation.ownerRequestedRawValue).toBeNull();
          expect(createdOwnerOperation.ownerRequestedFee).toBeNull();

          const updatedWalletAccount = await WalletAccountModel.findOne({
            where: { id: walletAccount.id },
          });

          expect(updatedWalletAccount).not.toBeNull();
          expect(updatedWalletAccount.balance).toBe(
            walletAccount.balance - value,
          );
          expect(updatedWalletAccount.pendingAmount).toBe(
            walletAccount.pendingAmount + value,
          );
        } catch (error) {
          throw error;
        }
      });

      it('TC1008 - Should create an owner operation when ownerAllowAvailableRawValue is TRUE and balance is LESS than rawValue + fee successfully', async () => {
        const balance = 500;
        const originalRawValue = 1000;
        const originalFee = 10;

        const currency = await createCurrency();
        const { user, wallet, walletAccount } = await createUser(currency, {
          balance,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);
        try {
          const ownerInfo: CreateOperationParticipant = {
            operation: new OperationEntity({ id: faker.datatype.uuid() }),
            wallet,
            currency,
            rawValue: originalRawValue,
            fee: originalFee,
            description: 'Send PIX REFUND',
            ownerAllowAvailableRawValue: true,
          };

          const { ownerOperation, beneficiaryOperation } = await executeUseCase(
            { ownerInfo, transactionTypeTag: transactionType.tag },
          );

          const newRawValue = walletAccount.balance - ownerInfo.fee;
          const newFee = ownerInfo.fee;
          const value = newRawValue + newFee;

          expect(ownerOperation).not.toBeNull();
          expect(beneficiaryOperation).toBeNull();

          expect(ownerOperation.id).toBe(ownerInfo.operation.id);
          expect(ownerOperation.rawValue).toBe(newRawValue);
          expect(ownerOperation.value).toBe(value);
          expect(ownerOperation.fee).toBe(newFee);
          expect(ownerOperation.description).toBe(ownerInfo.description);
          expect(ownerOperation.transactionType.id).toBe(transactionType.id);
          expect(ownerOperation.currency.id).toBe(currency.id);
          expect(ownerOperation.operationRef).toBeNull();
          expect(ownerOperation.state).toBe(OperationState.PENDING);
          expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
          expect(ownerOperation.ownerRequestedRawValue).toBe(originalRawValue);
          expect(ownerOperation.ownerRequestedFee).toBe(originalFee);

          expect(ownerOperation.owner).not.toBeNull();
          expect(ownerOperation.ownerWalletAccount).not.toBeNull();
          expect(ownerOperation.beneficiary).toBeNull();
          expect(ownerOperation.beneficiaryWalletAccount).toBeNull();

          expect(ownerOperation.owner.id).toBe(user.id);
          expect(ownerOperation.ownerWalletAccount.id).toBe(walletAccount.id);

          const createdOwnerOperation = await OperationModel.findOne({
            where: { id: ownerInfo.operation.id },
          });

          expect(createdOwnerOperation).not.toBeNull();
          expect(createdOwnerOperation.rawValue).toBe(newRawValue);
          expect(createdOwnerOperation.value).toBe(value);
          expect(createdOwnerOperation.fee).toBe(newFee);
          expect(createdOwnerOperation.description).toBe(ownerInfo.description);
          expect(createdOwnerOperation.transactionTypeId).toBe(
            transactionType.id,
          );
          expect(createdOwnerOperation.currencyId).toBe(currency.id);
          expect(createdOwnerOperation.operationRefId).toBeNull();
          expect(createdOwnerOperation.state).toBe(OperationState.PENDING);
          expect(createdOwnerOperation.ownerRequestedRawValue).toBe(
            originalRawValue,
          );
          expect(createdOwnerOperation.ownerRequestedFee).toBe(originalFee);

          expect(createdOwnerOperation.ownerId).not.toBeNull();
          expect(createdOwnerOperation.ownerWalletAccountId).not.toBeNull();
          expect(createdOwnerOperation.beneficiaryId).not.toBeNull();
          expect(
            createdOwnerOperation.beneficiaryWalletAccountId,
          ).not.toBeNull();

          expect(createdOwnerOperation.ownerId).toBe(user.id);
          expect(createdOwnerOperation.ownerWalletAccountId).toBe(
            walletAccount.id,
          );
          expect(createdOwnerOperation.beneficiaryId).toBe(0);
          expect(createdOwnerOperation.beneficiaryWalletAccountId).toBe(0);

          const updatedWalletAccount = await WalletAccountModel.findOne({
            where: { id: walletAccount.id },
          });

          expect(updatedWalletAccount).not.toBeNull();
          expect(updatedWalletAccount.balance).toBe(
            walletAccount.balance - value,
          );
          expect(updatedWalletAccount.pendingAmount).toBe(
            walletAccount.pendingAmount + value,
          );
        } catch (error) {
          throw error;
        }
      });

      it('TC1009 - Should create an owner operation when ownerAllowAvailableRawValue is TRUE and balance is LESS than rawValue + fee and LESS than fee too successfully', async () => {
        const balance = 10;
        const originalRawValue = 50;
        const originalFee = 20;

        const currency = await createCurrency();
        const { user, wallet, walletAccount } = await createUser(currency, {
          balance,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);
        try {
          const ownerInfo: CreateOperationParticipant = {
            operation: new OperationEntity({ id: faker.datatype.uuid() }),
            wallet,
            currency,
            rawValue: originalRawValue,
            fee: originalFee,
            description: 'Send PIX REFUND',
            ownerAllowAvailableRawValue: true,
          };

          const { ownerOperation, beneficiaryOperation } = await executeUseCase(
            { ownerInfo, transactionTypeTag: transactionType.tag },
          );

          const newRawValue = 0;
          const newFee = balance;
          const value = newRawValue + newFee;

          expect(ownerOperation).not.toBeNull();
          expect(beneficiaryOperation).toBeNull();

          expect(ownerOperation.id).toBe(ownerInfo.operation.id);
          expect(ownerOperation.rawValue).toBe(newRawValue);
          expect(ownerOperation.value).toBe(value);
          expect(ownerOperation.fee).toBe(newFee);
          expect(ownerOperation.description).toBe(ownerInfo.description);
          expect(ownerOperation.transactionType.id).toBe(transactionType.id);
          expect(ownerOperation.currency.id).toBe(currency.id);
          expect(ownerOperation.operationRef).toBeNull();
          expect(ownerOperation.state).toBe(OperationState.PENDING);
          expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
          expect(ownerOperation.ownerRequestedRawValue).toBe(originalRawValue);
          expect(ownerOperation.ownerRequestedFee).toBe(originalFee);

          expect(ownerOperation.owner).not.toBeNull();
          expect(ownerOperation.ownerWalletAccount).not.toBeNull();
          expect(ownerOperation.beneficiary).toBeNull();
          expect(ownerOperation.beneficiaryWalletAccount).toBeNull();

          expect(ownerOperation.owner.id).toBe(user.id);
          expect(ownerOperation.ownerWalletAccount.id).toBe(walletAccount.id);

          const createdOwnerOperation = await OperationModel.findOne({
            where: { id: ownerInfo.operation.id },
          });

          expect(createdOwnerOperation).not.toBeNull();
          expect(createdOwnerOperation.rawValue).toBe(newRawValue);
          expect(createdOwnerOperation.value).toBe(value);
          expect(createdOwnerOperation.fee).toBe(newFee);
          expect(createdOwnerOperation.description).toBe(ownerInfo.description);
          expect(createdOwnerOperation.transactionTypeId).toBe(
            transactionType.id,
          );
          expect(createdOwnerOperation.currencyId).toBe(currency.id);
          expect(createdOwnerOperation.operationRefId).toBeNull();
          expect(createdOwnerOperation.state).toBe(OperationState.PENDING);
          expect(createdOwnerOperation.ownerRequestedRawValue).toBe(50);
          expect(createdOwnerOperation.ownerRequestedFee).toBe(20);

          expect(createdOwnerOperation.ownerId).not.toBeNull();
          expect(createdOwnerOperation.ownerWalletAccountId).not.toBeNull();
          expect(createdOwnerOperation.beneficiaryId).not.toBeNull();
          expect(
            createdOwnerOperation.beneficiaryWalletAccountId,
          ).not.toBeNull();

          expect(createdOwnerOperation.ownerId).toBe(user.id);
          expect(createdOwnerOperation.ownerWalletAccountId).toBe(
            walletAccount.id,
          );
          expect(createdOwnerOperation.beneficiaryId).toBe(0);
          expect(createdOwnerOperation.beneficiaryWalletAccountId).toBe(0);

          const updatedWalletAccount = await WalletAccountModel.findOne({
            where: { id: walletAccount.id },
          });

          expect(updatedWalletAccount).not.toBeNull();
          expect(updatedWalletAccount.balance).toBe(
            walletAccount.balance - value,
          );
          expect(updatedWalletAccount.pendingAmount).toBe(
            walletAccount.pendingAmount + value,
          );
        } catch (error) {
          throw error;
        }
      });

      it('TC1010 - Should create when user has credit balance available and liability is LESS than creditBalance ', async () => {
        const currency1 = await createCurrency('BTC');
        const currency2 = await createCurrency();
        const { user, wallet, walletAccounts } = await createSameUser(
          [currency1, currency2],
          { balance: 0, pendingAmount: 0 },
        );
        const transactionType = await createTransactionType({ tag: 'CONV' });
        const limitType = await createLimitType(currency2, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, { creditBalance: 100 });
        const operationStreamQuotation =
          await OperationStreamQuotationFactory.create<OperationStreamQuotationEntity>(
            OperationStreamQuotationEntity.name,
            { baseCurrency: currency1, price: 5.0 },
          );

        mockGetOperationStreamQuotation.mockResolvedValue([
          operationStreamQuotation,
        ]);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency: currency1,
          rawValue: 10,
          fee: 1,
          description: 'Conversion withdrawal',
        };

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency: currency2,
          rawValue: 50,
          fee: 1,
          description: 'Conversion deposit',
        };

        const pendingWalletOwner =
          await PendingWalletAccountTransactionFactory.create<PendingWalletAccountTransactionEntity>(
            PendingWalletAccountTransactionEntity.name,
            {
              operation: ownerInfo.operation,
              value: -ownerInfo.rawValue,
              walletAccount: walletAccounts[0],
            },
          );

        const pendingWalletBeneficiary =
          await PendingWalletAccountTransactionFactory.create<PendingWalletAccountTransactionEntity>(
            PendingWalletAccountTransactionEntity.name,
            {
              operation: beneficiaryInfo.operation,
              value: beneficiaryInfo.rawValue,
              walletAccount: walletAccounts[1],
            },
          );

        mockGetPendingWalletAccountTransaction
          .mockReturnValueOnce([pendingWalletOwner])
          .mockReturnValueOnce([pendingWalletBeneficiary]);

        const { ownerOperation, beneficiaryOperation } = await executeUseCase({
          ownerInfo,
          beneficiaryInfo,
          transactionTypeTag: transactionType.tag,
        });

        expect(mockCreatePendingWalletAccountTransaction).toHaveBeenCalledTimes(
          2,
        );
        expect(mockUpdatePendingWalletAccountTransaction).toHaveBeenCalledTimes(
          2,
        );
        expect(mockGetPendingWalletAccountTransaction).toHaveBeenCalledTimes(2);
        expect(mockGetOperationStreamQuotation).toHaveBeenCalledTimes(1);

        const value1 = ownerInfo.rawValue + ownerInfo.fee;
        const value2 = beneficiaryInfo.rawValue - beneficiaryInfo.fee;

        expect(ownerOperation).not.toBeNull();
        expect(beneficiaryOperation).not.toBeNull();

        expect(ownerOperation.id).not.toBe(beneficiaryOperation.id);

        expect(ownerOperation.id).toBe(ownerInfo.operation.id);
        expect(ownerOperation.rawValue).toBe(ownerInfo.rawValue);
        expect(ownerOperation.value).toBe(value1);
        expect(ownerOperation.fee).toBe(ownerInfo.fee);
        expect(ownerOperation.description).toBe(ownerInfo.description);
        expect(ownerOperation.transactionType.id).toBe(transactionType.id);
        expect(ownerOperation.currency.id).toBe(currency1.id);
        expect(ownerOperation.operationRef).not.toBeNull();
        expect(ownerOperation.operationRef.id).toBe(beneficiaryOperation.id);
        expect(ownerOperation.state).toBe(OperationState.PENDING);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);

        expect(ownerOperation.owner).not.toBeNull();
        expect(ownerOperation.ownerWalletAccount).not.toBeNull();
        expect(ownerOperation.beneficiary).toBeNull();
        expect(ownerOperation.beneficiaryWalletAccount).toBeNull();

        expect(ownerOperation.owner.id).toBe(user.id);
        expect(ownerOperation.ownerWalletAccount.id).toBe(walletAccounts[0].id);

        expect(beneficiaryOperation.id).toBe(beneficiaryInfo.operation.id);
        expect(beneficiaryOperation.rawValue).toBe(beneficiaryInfo.rawValue);
        expect(beneficiaryOperation.value).toBe(value2);
        expect(beneficiaryOperation.fee).toBe(beneficiaryInfo.fee);
        expect(beneficiaryOperation.description).toBe(
          beneficiaryInfo.description,
        );
        expect(beneficiaryOperation.transactionType.id).toBe(
          transactionType.id,
        );
        expect(beneficiaryOperation.currency.id).toBe(currency2.id);
        expect(beneficiaryOperation.operationRef).not.toBeNull();
        expect(beneficiaryOperation.operationRef.id).toBe(ownerOperation.id);
        expect(beneficiaryOperation.state).toBe(OperationState.PENDING);

        expect(beneficiaryOperation.owner).toBeNull();
        expect(beneficiaryOperation.ownerWalletAccount).toBeNull();
        expect(beneficiaryOperation.beneficiary).not.toBeNull();
        expect(beneficiaryOperation.beneficiaryWalletAccount).not.toBeNull();

        expect(beneficiaryOperation.beneficiary.id).toBe(user.id);
        expect(beneficiaryOperation.beneficiaryWalletAccount.id).toBe(
          walletAccounts[1].id,
        );

        const createdOwnerOperation = await OperationModel.findOne({
          where: { id: ownerInfo.operation.id },
        });

        expect(createdOwnerOperation).not.toBeNull();
        expect(createdOwnerOperation.rawValue).toBe(ownerInfo.rawValue);
        expect(createdOwnerOperation.value).toBe(value1);
        expect(createdOwnerOperation.fee).toBe(ownerInfo.fee);
        expect(createdOwnerOperation.description).toBe(ownerInfo.description);
        expect(createdOwnerOperation.transactionTypeId).toBe(
          transactionType.id,
        );
        expect(createdOwnerOperation.currencyId).toBe(currency1.id);
        expect(createdOwnerOperation.operationRefId).toBe(
          beneficiaryOperation.id,
        );
        expect(createdOwnerOperation.state).toBe(OperationState.PENDING);

        expect(createdOwnerOperation.ownerId).not.toBeNull();
        expect(createdOwnerOperation.ownerWalletAccountId).not.toBeNull();
        expect(createdOwnerOperation.beneficiaryId).not.toBeNull();
        expect(createdOwnerOperation.beneficiaryWalletAccountId).not.toBeNull();

        expect(createdOwnerOperation.ownerId).toBe(user.id);
        expect(createdOwnerOperation.ownerWalletAccountId).toBe(
          walletAccounts[0].id,
        );
        expect(createdOwnerOperation.beneficiaryId).toBe(0);
        expect(createdOwnerOperation.beneficiaryWalletAccountId).toBe(0);
        expect(createdOwnerOperation.ownerRequestedRawValue).toBeNull();
        expect(createdOwnerOperation.ownerRequestedFee).toBeNull();

        const updatedWalletAccount1 = await WalletAccountModel.findOne({
          where: { id: walletAccounts[0].id },
        });

        expect(updatedWalletAccount1).not.toBeNull();
        expect(updatedWalletAccount1.balance).toBe(
          walletAccounts[0].balance - value1,
        );
        expect(updatedWalletAccount1.pendingAmount).toBe(
          walletAccounts[0].pendingAmount + value1,
        );

        const createdBeneficiaryOperation = await OperationModel.findOne({
          where: { id: beneficiaryInfo.operation.id },
        });

        expect(createdBeneficiaryOperation).not.toBeNull();
        expect(createdBeneficiaryOperation.rawValue).toBe(
          beneficiaryInfo.rawValue,
        );
        expect(createdBeneficiaryOperation.value).toBe(value2);
        expect(createdBeneficiaryOperation.fee).toBe(beneficiaryInfo.fee);
        expect(createdBeneficiaryOperation.description).toBe(
          beneficiaryInfo.description,
        );
        expect(createdBeneficiaryOperation.transactionTypeId).toBe(
          transactionType.id,
        );
        expect(createdBeneficiaryOperation.currencyId).toBe(currency2.id);
        expect(createdBeneficiaryOperation.operationRefId).toBe(
          ownerOperation.id,
        );
        expect(createdBeneficiaryOperation.state).toBe(OperationState.PENDING);

        expect(createdBeneficiaryOperation.ownerId).not.toBeNull();
        expect(createdBeneficiaryOperation.ownerWalletAccountId).not.toBeNull();
        expect(createdBeneficiaryOperation.beneficiaryId).not.toBeNull();
        expect(
          createdBeneficiaryOperation.beneficiaryWalletAccountId,
        ).not.toBeNull();

        expect(createdBeneficiaryOperation.ownerId).toBe(0);
        expect(createdBeneficiaryOperation.ownerWalletAccountId).toBe(0);
        expect(createdBeneficiaryOperation.beneficiaryId).toBe(user.id);
        expect(createdBeneficiaryOperation.beneficiaryWalletAccountId).toBe(
          walletAccounts[1].id,
        );
        expect(createdBeneficiaryOperation.ownerRequestedRawValue).toBeNull();
        expect(createdBeneficiaryOperation.ownerRequestedFee).toBeNull();

        const updatedWalletAccount2 = await WalletAccountModel.findOne({
          where: { id: walletAccounts[1].id },
        });

        expect(updatedWalletAccount2).not.toBeNull();
        expect(updatedWalletAccount2.balance).toBe(walletAccounts[1].balance);
        expect(updatedWalletAccount2.pendingAmount).toBe(
          walletAccounts[1].pendingAmount,
        );
      });

      it('TC1011 - Should create a P2P shared operation with same owner and beneficiary', async () => {
        const currency = await createCurrency();
        const { user, wallet, walletAccount } = await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BOTH,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        const { ownerOperation, beneficiaryOperation } = await executeUseCase({
          ownerInfo,
          beneficiaryInfo,
          transactionTypeTag: transactionType.tag,
        });

        const value = ownerInfo.rawValue + ownerInfo.fee;

        expect(ownerOperation).not.toBeNull();
        expect(beneficiaryOperation).not.toBeNull();

        expect(ownerOperation.id).toBe(beneficiaryOperation.id);

        expect(ownerOperation.id).toBe(ownerInfo.operation.id);
        expect(ownerOperation.rawValue).toBe(ownerInfo.rawValue);
        expect(ownerOperation.value).toBe(value);
        expect(ownerOperation.fee).toBe(ownerInfo.fee);
        expect(ownerOperation.description).toBe(ownerInfo.description);
        expect(ownerOperation.transactionType.id).toBe(transactionType.id);
        expect(ownerOperation.currency.id).toBe(currency.id);
        expect(ownerOperation.operationRef).toBeNull();
        expect(ownerOperation.state).toBe(OperationState.PENDING);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);

        expect(ownerOperation.owner).not.toBeNull();
        expect(ownerOperation.ownerWalletAccount).not.toBeNull();
        expect(ownerOperation.beneficiary).not.toBeNull();
        expect(ownerOperation.beneficiaryWalletAccount).not.toBeNull();

        expect(ownerOperation.owner.id).toBe(user.id);
        expect(ownerOperation.ownerWalletAccount.id).toBe(walletAccount.id);
        expect(ownerOperation.beneficiary.id).toBe(user.id);
        expect(ownerOperation.beneficiaryWalletAccount.id).toBe(
          walletAccount.id,
        );

        const createdOwnerOperation = await OperationModel.findOne({
          where: { id: ownerInfo.operation.id },
        });

        expect(createdOwnerOperation).not.toBeNull();
        expect(createdOwnerOperation.rawValue).toBe(ownerInfo.rawValue);
        expect(createdOwnerOperation.value).toBe(value);
        expect(createdOwnerOperation.fee).toBe(ownerInfo.fee);
        expect(createdOwnerOperation.description).toBe(ownerInfo.description);
        expect(createdOwnerOperation.transactionTypeId).toBe(
          transactionType.id,
        );
        expect(createdOwnerOperation.currencyId).toBe(currency.id);
        expect(createdOwnerOperation.operationRefId).toBeNull();
        expect(createdOwnerOperation.state).toBe(OperationState.PENDING);

        expect(createdOwnerOperation.ownerId).toBe(user.id);
        expect(createdOwnerOperation.ownerWalletAccountId).toBe(
          walletAccount.id,
        );
        expect(createdOwnerOperation.beneficiaryId).toBe(user.id);
        expect(createdOwnerOperation.beneficiaryWalletAccountId).toBe(
          walletAccount.id,
        );
        expect(createdOwnerOperation.ownerRequestedRawValue).toBeNull();
        expect(createdOwnerOperation.ownerRequestedFee).toBeNull();

        const updatedWalletAccount = await WalletAccountModel.findOne({
          where: { id: walletAccount.id },
        });

        expect(updatedWalletAccount).not.toBeNull();
        expect(updatedWalletAccount.balance).toBe(
          walletAccount.balance - value,
        );
        expect(updatedWalletAccount.pendingAmount).toBe(
          walletAccount.pendingAmount + value,
        );
      });

      /**
       * Should not find OWNER user limit neither its associated user limit tracker.
       * Should create new user limit and user limit tracker, which constants will be incremented by the operation value.
       * Should not find BENEFICIARY user limit, but create a new one, but do not create a new user limit tracker,
       * since this type of operation is not limited for the beneficiary.
       * The operation should be created with its analysis tags and user limit tracker fulfilled.
       */
      it('TC1012 - Should create/update a new user limit tracker and create new BOTH PARTICIPANTS operation successfully.', async () => {
        const currency = await createCurrency();
        const { user: user1, walletAccount: walletAccount1 } =
          await createUser(currency);
        const { user: user2, walletAccount: walletAccount2 } =
          await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BOTH,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType, {
          nightlyLimit: 10000,
          nighttimeStart: '00:00',
          nighttimeEnd: '23:59',
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet: walletAccount1.wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet: walletAccount2.wallet,
          currency,
          rawValue: 2000,
          fee: 0,
          description: 'Send PIX',
        };

        const { ownerOperation, beneficiaryOperation } = await executeUseCase({
          ownerInfo,
          beneficiaryInfo,
          transactionTypeTag: transactionType.tag,
        });

        const value = ownerInfo.rawValue + ownerInfo.fee;

        expect(ownerOperation).not.toBeNull();
        expect(beneficiaryOperation).not.toBeNull();

        expect(ownerOperation.id).toBe(beneficiaryOperation.id);

        expect(ownerOperation.id).toBe(ownerInfo.operation.id);
        expect(ownerOperation.rawValue).toBe(ownerInfo.rawValue);
        expect(ownerOperation.value).toBe(value);
        expect(ownerOperation.fee).toBe(ownerInfo.fee);
        expect(ownerOperation.description).toBe(ownerInfo.description);
        expect(ownerOperation.transactionType.id).toBe(transactionType.id);
        expect(ownerOperation.currency.id).toBe(currency.id);
        expect(ownerOperation.operationRef).toBeNull();
        expect(ownerOperation.state).toBe(OperationState.PENDING);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);

        expect(ownerOperation.owner).not.toBeNull();
        expect(ownerOperation.ownerWalletAccount).not.toBeNull();
        expect(ownerOperation.beneficiary).not.toBeNull();
        expect(ownerOperation.beneficiaryWalletAccount).not.toBeNull();

        expect(ownerOperation.owner.id).toBe(user1.id);
        expect(ownerOperation.ownerWalletAccount.id).toBe(walletAccount1.id);
        expect(ownerOperation.beneficiary.id).toBe(user2.id);
        expect(ownerOperation.beneficiaryWalletAccount.id).toBe(
          walletAccount2.id,
        );

        const createdOwnerOperation = await OperationModel.findOne({
          where: { id: ownerInfo.operation.id },
        });
        const createdUserLimitTracker = await UserLimitTrackerModel.findOne({
          where: { id: createdOwnerOperation.userLimitTrackerId },
        });

        expect(createdOwnerOperation.userLimitTrackerId).not.toBeNull();
        expect(createdOwnerOperation.analysisTags).not.toBeNull();
        expect(createdUserLimitTracker.usedDailyLimit).toBe(
          createdOwnerOperation.value,
        );
        expect(createdUserLimitTracker.usedMonthlyLimit).toBe(
          createdOwnerOperation.value,
        );
        expect(createdUserLimitTracker.usedAnnualLimit).toBe(
          createdOwnerOperation.value,
        );
        expect(createdUserLimitTracker.usedNightlyLimit).toBe(
          createdOwnerOperation.value,
        );

        expect(createdOwnerOperation).not.toBeNull();
        expect(createdOwnerOperation.rawValue).toBe(ownerInfo.rawValue);
        expect(createdOwnerOperation.value).toBe(value);
        expect(createdOwnerOperation.fee).toBe(ownerInfo.fee);
        expect(createdOwnerOperation.description).toBe(ownerInfo.description);
        expect(createdOwnerOperation.transactionTypeId).toBe(
          transactionType.id,
        );
        expect(createdOwnerOperation.currencyId).toBe(currency.id);
        expect(createdOwnerOperation.operationRefId).toBeNull();
        expect(createdOwnerOperation.state).toBe(OperationState.PENDING);

        expect(createdOwnerOperation.ownerId).not.toBeNull();
        expect(createdOwnerOperation.ownerWalletAccountId).not.toBeNull();
        expect(createdOwnerOperation.beneficiaryId).not.toBeNull();
        expect(createdOwnerOperation.beneficiaryWalletAccountId).not.toBeNull();

        expect(createdOwnerOperation.ownerId).toBe(user1.id);
        expect(createdOwnerOperation.ownerWalletAccountId).toBe(
          walletAccount1.id,
        );
        expect(createdOwnerOperation.beneficiaryId).toBe(user2.id);
        expect(createdOwnerOperation.beneficiaryWalletAccountId).toBe(
          walletAccount2.id,
        );
        expect(createdOwnerOperation.ownerRequestedRawValue).toBeNull();
        expect(createdOwnerOperation.ownerRequestedFee).toBeNull();

        const updatedWalletAccount1 = await WalletAccountModel.findOne({
          where: { id: walletAccount1.id },
        });

        expect(updatedWalletAccount1).not.toBeNull();
        expect(updatedWalletAccount1.balance).toBe(
          walletAccount1.balance - value,
        );
        expect(updatedWalletAccount1.pendingAmount).toBe(
          walletAccount1.pendingAmount + value,
        );

        const updatedWalletAccount2 = await WalletAccountModel.findOne({
          where: { id: walletAccount2.id },
        });

        expect(updatedWalletAccount2).not.toBeNull();
        expect(updatedWalletAccount2.balance).toBe(walletAccount2.balance);
        expect(updatedWalletAccount2.pendingAmount).toBe(
          walletAccount2.pendingAmount,
        );
      });

      /**
       * Should find OWNER user limit and its associated user limit tracker.
       * The OWNER user limit tracker is outdated, so it should be restated before incrementing the operation value on its constants.
       * Should not find BENEFICIARY user limit, but create a new one, but do not create a new user limit tracker,
       * since this type of operation is not limited for the beneficiary.
       * The operation should be created with its analysis tags and user limit tracker fulfilled.
       */
      it('TC1013 - Should restart/update user limit tracker and create new BOTH PARTICIPANTS operation successfully.', async () => {
        const currency = await createCurrency();
        const { user: user1, walletAccount: walletAccount1 } =
          await createUser(currency);
        const { user: user2, walletAccount: walletAccount2 } =
          await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BOTH,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        const userLimit = await createUserLimit(user1, limitType, {
          nighttimeStart: '00:00',
          nighttimeEnd: '00:01',
        });
        await createUserLimitTracker(userLimit, limitType, {
          usedDailyLimit: userLimit.dailyLimit,
          usedMonthlyLimit: userLimit.monthlyLimit,
          usedAnnualLimit: userLimit.yearlyLimit,
          usedNightlyLimit: userLimit.nightlyLimit,
          updatedAt: getMoment().subtract(1, 'year').toISOString(),
        });
        await createUserLimit(user2, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet: walletAccount1.wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet: walletAccount2.wallet,
          currency,
          rawValue: 2000,
          fee: 0,
          description: 'Send PIX',
        };

        const { ownerOperation, beneficiaryOperation } = await executeUseCase({
          ownerInfo,
          beneficiaryInfo,
          transactionTypeTag: transactionType.tag,
        });

        const value = ownerInfo.rawValue + ownerInfo.fee;

        expect(ownerOperation).not.toBeNull();
        expect(beneficiaryOperation).not.toBeNull();

        expect(ownerOperation.id).toBe(beneficiaryOperation.id);

        expect(ownerOperation.id).toBe(ownerInfo.operation.id);
        expect(ownerOperation.rawValue).toBe(ownerInfo.rawValue);
        expect(ownerOperation.value).toBe(value);
        expect(ownerOperation.fee).toBe(ownerInfo.fee);
        expect(ownerOperation.description).toBe(ownerInfo.description);
        expect(ownerOperation.transactionType.id).toBe(transactionType.id);
        expect(ownerOperation.currency.id).toBe(currency.id);
        expect(ownerOperation.operationRef).toBeNull();
        expect(ownerOperation.state).toBe(OperationState.PENDING);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);

        expect(ownerOperation.owner).not.toBeNull();
        expect(ownerOperation.ownerWalletAccount).not.toBeNull();
        expect(ownerOperation.beneficiary).not.toBeNull();
        expect(ownerOperation.beneficiaryWalletAccount).not.toBeNull();

        expect(ownerOperation.owner.id).toBe(user1.id);
        expect(ownerOperation.ownerWalletAccount.id).toBe(walletAccount1.id);
        expect(ownerOperation.beneficiary.id).toBe(user2.id);
        expect(ownerOperation.beneficiaryWalletAccount.id).toBe(
          walletAccount2.id,
        );

        const createdOwnerOperation = await OperationModel.findOne({
          where: { id: ownerInfo.operation.id },
        });
        const createdUserLimitTracker = await UserLimitTrackerModel.findOne({
          where: { id: createdOwnerOperation.userLimitTrackerId },
        });

        expect(createdOwnerOperation.userLimitTrackerId).not.toBeNull();
        expect(createdOwnerOperation.analysisTags).not.toBeNull();
        expect(createdUserLimitTracker.usedDailyLimit).toBe(
          createdOwnerOperation.value,
        );
        expect(createdUserLimitTracker.usedMonthlyLimit).toBe(
          createdOwnerOperation.value,
        );
        expect(createdUserLimitTracker.usedAnnualLimit).toBe(
          createdOwnerOperation.value,
        );
        expect(createdUserLimitTracker.usedNightlyLimit).toBe(0);

        expect(createdOwnerOperation).not.toBeNull();
        expect(createdOwnerOperation.rawValue).toBe(ownerInfo.rawValue);
        expect(createdOwnerOperation.value).toBe(value);
        expect(createdOwnerOperation.fee).toBe(ownerInfo.fee);
        expect(createdOwnerOperation.description).toBe(ownerInfo.description);
        expect(createdOwnerOperation.transactionTypeId).toBe(
          transactionType.id,
        );
        expect(createdOwnerOperation.currencyId).toBe(currency.id);
        expect(createdOwnerOperation.operationRefId).toBeNull();
        expect(createdOwnerOperation.state).toBe(OperationState.PENDING);

        expect(createdOwnerOperation.ownerId).not.toBeNull();
        expect(createdOwnerOperation.ownerWalletAccountId).not.toBeNull();
        expect(createdOwnerOperation.beneficiaryId).not.toBeNull();
        expect(createdOwnerOperation.beneficiaryWalletAccountId).not.toBeNull();

        expect(createdOwnerOperation.ownerId).toBe(user1.id);
        expect(createdOwnerOperation.ownerWalletAccountId).toBe(
          walletAccount1.id,
        );
        expect(createdOwnerOperation.beneficiaryId).toBe(user2.id);
        expect(createdOwnerOperation.beneficiaryWalletAccountId).toBe(
          walletAccount2.id,
        );
        expect(createdOwnerOperation.ownerRequestedRawValue).toBeNull();
        expect(createdOwnerOperation.ownerRequestedFee).toBeNull();

        const updatedWalletAccount1 = await WalletAccountModel.findOne({
          where: { id: walletAccount1.id },
        });

        expect(updatedWalletAccount1).not.toBeNull();
        expect(updatedWalletAccount1.balance).toBe(
          walletAccount1.balance - value,
        );
        expect(updatedWalletAccount1.pendingAmount).toBe(
          walletAccount1.pendingAmount + value,
        );

        const updatedWalletAccount2 = await WalletAccountModel.findOne({
          where: { id: walletAccount2.id },
        });

        expect(updatedWalletAccount2).not.toBeNull();
        expect(updatedWalletAccount2.balance).toBe(walletAccount2.balance);
        expect(updatedWalletAccount2.pendingAmount).toBe(
          walletAccount2.pendingAmount,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0013 - Should not create operation without owner or beneficiary info', async () => {
        const transactionType = await createTransactionType();

        await expect(
          executeUseCase({ transactionTypeTag: transactionType.tag }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0014 - Should not create operation without transaction type', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0015 - Should not create operation without a valid owner info description', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: null,
        };

        await expect(() =>
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0016 - Should not create operation without owner info fee', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          description: 'Send PIX',
          fee: null,
        };

        await expect(() =>
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0017 - Should not create operation without a valid owner info raw value', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: -1,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(InvalidDataFormatException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0018 - Should not create operation without owner info wallet account id', async () => {
        const currency = await createCurrency();
        const { user } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet: null,
          currency: null,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0019 - Should not create operation without a valid beneficiary info description', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: null,
        };

        await expect(() =>
          executeUseCase({
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0020 - Should not create operation without beneficiary info fee', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          description: 'Send PIX',
          fee: null,
        };

        await expect(() =>
          executeUseCase({
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0021 - Should not create operation without a valid beneficiary info fee', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: -1,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(InvalidDataFormatException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0022 - Should not create operation without beneficiary info raw value', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: null,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0023 - Should not create operation without a valid beneficiary info raw value', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: -1,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(InvalidDataFormatException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0024 - Should not create operation without beneficiary info wallet account id', async () => {
        const currency = await createCurrency();
        const { user } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet: null,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
          currency: null,
        };

        await expect(() =>
          executeUseCase({
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0026 - Should not create operation without a valid transaction type', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: 'XXXXX',
          }),
        ).rejects.toThrow(TransactionTypeTagNotFoundException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0027 - Should not create owner operation without onwer', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
          currency: null,
        };

        await expect(
          executeUseCase({
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0028 - Should not create beneficiary operation without beneficiary', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BENEFICIARY,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0029 - Should not create both operation without beneficiary', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BOTH,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0030 - Should not create both operation without owner', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BOTH,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,

          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
          currency: null,
        };

        await expect(
          executeUseCase({
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0031 - Should not create operation without enough balance', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 500,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughFundsException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0032 - Should not create operation without enough balance to pay fee and value', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 1000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughFundsException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0033 - Should not create operation without enough daily limit', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 100,
          monthlyLimit: 20000,
          yearlyLimit: 30000,
          maxAmount: null,
          minAmount: null,
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0034 - Should not create operation without enough monthly limit', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 200,
          yearlyLimit: 30000,
          maxAmount: null,
          minAmount: null,
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0035 - Should not create operation without enough yearly limit', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 20000,
          yearlyLimit: 300,
          maxAmount: null,
          minAmount: null,
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0036 - Should not create operation without above max allowed', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 20000,
          yearlyLimit: 30000,
          maxAmount: 100,
          minAmount: null,
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(ValueAboveMaxAmountLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0037 - Should not create operation without bellow min allowed', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 20000,
          yearlyLimit: 30000,
          maxAmount: null,
          minAmount: 2000,
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(ValueUnderMinAmountLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0038 - Should not create operation without enough used daily limit by date', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 1500,
          monthlyLimit: 20000,
          yearlyLimit: 30000,
          maxAmount: null,
          minAmount: null,
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await executeUseCase({
          ownerInfo,
          transactionTypeTag: transactionType.tag,
        });

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughAvailableLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
      });

      it('TC0039 - Should not create operation without enough used monthly limit by date', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 1500,
          yearlyLimit: 30000,
          maxAmount: null,
          minAmount: null,
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await executeUseCase({
          ownerInfo,
          transactionTypeTag: transactionType.tag,
        });

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughAvailableLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
      });

      it('TC0040 - Should not create operation without enough used yearly limit by date', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 20000,
          yearlyLimit: 1500,
          maxAmount: null,
          minAmount: null,
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await executeUseCase({
          ownerInfo,
          transactionTypeTag: transactionType.tag,
        });

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughAvailableLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
      });

      it('TC0041 - Should not create operation without enough used daily limit by period', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType, {
          periodStart: LimitTypePeriodStart.INTERVAL,
          check: LimitTypeCheck.OWNER,
        });
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 1500,
          monthlyLimit: 20000,
          yearlyLimit: 30000,
          maxAmount: null,
          minAmount: null,
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await executeUseCase({
          ownerInfo,
          transactionTypeTag: transactionType.tag,
        });

        await OperationModel.update(
          { createdAt: getMoment().subtract(1, 'day').add(1, 'hour') },
          { where: { id: ownerInfo.operation.id } },
        );

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughAvailableLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
      });

      it('TC0042 - Should not create operation without enough used monthly limit by period', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType, {
          periodStart: LimitTypePeriodStart.INTERVAL,
          check: LimitTypeCheck.OWNER,
        });
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 1500,
          yearlyLimit: 30000,
          maxAmount: null,
          minAmount: null,
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await executeUseCase({
          ownerInfo,
          transactionTypeTag: transactionType.tag,
        });

        await OperationModel.update(
          { createdAt: getMoment().subtract(1, 'month').add(1, 'minute') },
          { where: { id: ownerInfo.operation.id } },
        );

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughAvailableLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
      });

      it('TC0043 - Should not create operation without enough used yearly limit by period', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType, {
          periodStart: LimitTypePeriodStart.INTERVAL,
          check: LimitTypeCheck.OWNER,
        });
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 20000,
          yearlyLimit: 1500,
          maxAmount: null,
          minAmount: null,
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await executeUseCase({
          ownerInfo,
          transactionTypeTag: transactionType.tag,
        });

        await OperationModel.update(
          { createdAt: getMoment().subtract(1, 'month').add(1, 'minute') },
          { where: { id: ownerInfo.operation.id } },
        );

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughAvailableLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
      });

      it('TC0044 - Should not create operation without enough used daily limit by date', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        let transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BENEFICIARY,
        });
        const limitType = await createLimitType(currency, transactionType, {
          tag: transactionType.tag,
          periodStart: LimitTypePeriodStart.DATE,
          check: LimitTypeCheck.BOTH,
        });
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 1500,
          monthlyLimit: 20000,
          yearlyLimit: 30000,
          maxAmount: null,
          minAmount: null,
        });

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Receive PIX',
        };

        await executeUseCase({
          beneficiaryInfo,
          transactionTypeTag: transactionType.tag,
        });

        await TransactionTypeModel.update(
          {
            tag: transactionType.tag,
            participants: TransactionTypeParticipants.OWNER,
          },
          { where: { id: transactionType.id } },
        );

        transactionType = await TransactionTypeModel.findOne({
          where: { id: transactionType.id },
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughAvailableLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
      });

      it('TC0045 - Should not create operation without enough used monthly limit by date', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        let transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BENEFICIARY,
        });
        const limitType = await createLimitType(currency, transactionType, {
          tag: transactionType.tag,
          periodStart: LimitTypePeriodStart.DATE,
          check: LimitTypeCheck.BOTH,
        });
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 1500,
          yearlyLimit: 30000,
          maxAmount: null,
          minAmount: null,
        });

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Receive PIX',
        };

        await executeUseCase({
          beneficiaryInfo,
          transactionTypeTag: transactionType.tag,
        });

        await TransactionTypeModel.update(
          {
            tag: transactionType.tag,
            participants: TransactionTypeParticipants.OWNER,
          },
          { where: { id: transactionType.id } },
        );

        transactionType = await TransactionTypeModel.findOne({
          where: { id: transactionType.id },
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughAvailableLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
      });

      it('TC0046 - Should not create operation without enough used yearly limit by date', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        let transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BENEFICIARY,
        });
        const limitType = await createLimitType(currency, transactionType, {
          tag: transactionType.tag,
          periodStart: LimitTypePeriodStart.DATE,
          check: LimitTypeCheck.BOTH,
        });
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 20000,
          yearlyLimit: 1500,
          maxAmount: null,
          minAmount: null,
        });

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Receive PIX',
        };

        await executeUseCase({
          beneficiaryInfo,
          transactionTypeTag: transactionType.tag,
        });

        await TransactionTypeModel.update(
          {
            tag: transactionType.tag,
            participants: TransactionTypeParticipants.OWNER,
          },
          { where: { id: transactionType.id } },
        );

        transactionType = await TransactionTypeModel.findOne({
          where: { id: transactionType.id },
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughAvailableLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
      });

      it('TC0047 - Should not create operation without enough used daily limit by interval', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        let transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BENEFICIARY,
        });
        const limitType = await createLimitType(currency, transactionType, {
          tag: transactionType.tag,
          periodStart: LimitTypePeriodStart.INTERVAL,
          check: LimitTypeCheck.BOTH,
        });
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 1500,
          monthlyLimit: 20000,
          yearlyLimit: 30000,
          maxAmount: null,
          minAmount: null,
        });

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Receive PIX',
        };

        await executeUseCase({
          beneficiaryInfo,
          transactionTypeTag: transactionType.tag,
        });

        await TransactionTypeModel.update(
          {
            tag: transactionType.tag,
            participants: TransactionTypeParticipants.OWNER,
          },
          { where: { id: transactionType.id } },
        );

        transactionType = await TransactionTypeModel.findOne({
          where: { id: transactionType.id },
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughAvailableLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
      });

      it('TC0048 - Should not create operation without enough used monthly limit by interval', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        let transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BENEFICIARY,
        });
        const limitType = await createLimitType(currency, transactionType, {
          tag: transactionType.tag,
          periodStart: LimitTypePeriodStart.INTERVAL,
          check: LimitTypeCheck.BOTH,
        });
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 1500,
          yearlyLimit: 30000,
          maxAmount: null,
          minAmount: null,
        });

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Receive PIX',
        };

        await executeUseCase({
          beneficiaryInfo,
          transactionTypeTag: transactionType.tag,
        });

        await TransactionTypeModel.update(
          {
            tag: transactionType.tag,
            participants: TransactionTypeParticipants.OWNER,
          },
          { where: { id: transactionType.id } },
        );

        transactionType = await TransactionTypeModel.findOne({
          where: { id: transactionType.id },
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughAvailableLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
      });

      it('TC0049 - Should not create operation without enough used yearly limit by interval', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        let transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BENEFICIARY,
        });
        const limitType = await createLimitType(currency, transactionType, {
          tag: transactionType.tag,
          periodStart: LimitTypePeriodStart.INTERVAL,
          check: LimitTypeCheck.BOTH,
        });
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 20000,
          yearlyLimit: 1500,
          maxAmount: null,
          minAmount: null,
        });

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Receive PIX',
        };

        await executeUseCase({
          beneficiaryInfo,
          transactionTypeTag: transactionType.tag,
        });

        await TransactionTypeModel.update(
          {
            tag: transactionType.tag,
            participants: TransactionTypeParticipants.OWNER,
          },
          { where: { id: transactionType.id } },
        );

        transactionType = await TransactionTypeModel.findOne({
          where: { id: transactionType.id },
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughAvailableLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
      });

      it('TC0050 - Should not create operation without enough nightly limit', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType, {
          tag: transactionType.tag,
          periodStart: LimitTypePeriodStart.DATE,
          check: LimitTypeCheck.OWNER,
        });

        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          nightlyLimit: 100,
          dailyLimit: 10000,
          monthlyLimit: 20000,
          yearlyLimit: 30000,
          maxAmount: null,
          minAmount: null,
          nighttimeStart: getMoment().subtract(1, 'hour').format('HH:mm'),
          nighttimeEnd: getMoment().add(1, 'hour').format('HH:mm'),
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0051 - Should not create operation without enough used yearly limit by date', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType, {
          tag: transactionType.tag,
          periodStart: LimitTypePeriodStart.DATE,
          check: LimitTypeCheck.OWNER,
        });
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          nightlyLimit: 1500,
          dailyLimit: 10000,
          monthlyLimit: 20000,
          yearlyLimit: 30000,
          maxAmount: null,
          minAmount: null,
          nighttimeStart: getMoment().subtract(1, 'hour').format('HH:mm'),
          nighttimeEnd: getMoment().add(1, 'hour').format('HH:mm'),
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await executeUseCase({
          ownerInfo,
          transactionTypeTag: transactionType.tag,
        });

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughAvailableLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
      });

      it('TC0052 - Should not create operation without a owner operation id', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: null,
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0053 - Should not create operation without a beneficiary operation id', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: null,
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0055 - Should not create owner operation with invalid transaction type state', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.OWNER,
          state: 'TESTE',
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(DataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0056 - Should not create owner operation with deactivated transaction type', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.OWNER,
          state: TransactionTypeState.DEACTIVATE,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(TransactionTypeNotActiveException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0057 - Should not create owner operation without owner info', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.OWNER,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0058 - Should not create owner operation with invalid currency tag', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.OWNER,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency: new CurrencyEntity({ tag: 'XXXXX' }),
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(CurrencyNotFoundException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0059 - Should not create owner operation with inactive currency tag', async () => {
        const currency = await createCurrency(
          faker.datatype.uuid(),
          CurrencyState.DEACTIVATE,
        );
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.OWNER,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(CurrencyNotActiveException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0060 - Should not create owner operation with invalid wallet', async () => {
        const currency = await createCurrency();
        const { user } = await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.OWNER,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet: new WalletEntity({ uuid: faker.datatype.uuid() }),
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(WalletNotFoundException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0061 - Should not create owner operation with inactive wallet', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(
          currency,
          {},
          WalletState.DEACTIVATE,
        );
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.OWNER,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(WalletNotActiveException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0062 - Should not create owner operation with wallet account not found', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(
          currency,
          {},
          WalletState.ACTIVE,
          false,
        );
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.OWNER,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(WalletAccountNotFoundException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0063 - Should not create owner operation with wallet account not active', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(
          currency,
          {},
          WalletState.ACTIVE,
          true,
          WalletAccountState.DEACTIVATE,
        );
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.OWNER,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(WalletAccountNotActiveException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0064 - Should not create beneficiary operation with invalid currency tag', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BENEFICIARY,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency: new CurrencyEntity({ tag: 'XXXXX' }),
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(CurrencyNotFoundException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0065 - Should not create beneficiary operation with inactive currency tag', async () => {
        const currency = await createCurrency(
          faker.datatype.uuid(),
          CurrencyState.DEACTIVATE,
        );
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BENEFICIARY,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(CurrencyNotActiveException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0066 - Should not create beneficiary operation with invalid wallet', async () => {
        const currency = await createCurrency();
        const { user } = await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BENEFICIARY,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet: new WalletEntity({ uuid: faker.datatype.uuid() }),
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(WalletNotFoundException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0067 - Should not create beneficiary operation with inactive wallet', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(
          currency,
          {},
          WalletState.DEACTIVATE,
        );
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BENEFICIARY,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(WalletNotActiveException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0068 - Should not create beneficiary operation with wallet account not found', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(
          currency,
          {},
          WalletState.ACTIVE,
          false,
        );
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BENEFICIARY,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(WalletAccountNotFoundException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0069 - Should not create beneficiary operation with wallet account not active', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(
          currency,
          {},
          WalletState.ACTIVE,
          true,
          WalletAccountState.DEACTIVATE,
        );
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BENEFICIARY,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(WalletAccountNotActiveException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0070 - Should not create operation without enough user defined daily limit', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, { userDailyLimit: 100 });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0071 - Should not create operation without enough user defined monthly limit', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, { userMonthlyLimit: 100 });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0072 - Should not create operation without enough user defined yearly limit', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, { userYearlyLimit: 100 });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0073 - Should not create operation without enough user defined nighlty limit', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType, {
          tag: transactionType.tag,
          periodStart: LimitTypePeriodStart.DATE,
          check: LimitTypeCheck.OWNER,
        });

        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          userNightlyLimit: 100,
          nighttimeStart: getMoment().subtract(1, 'hour').format('HH:mm'),
          nighttimeEnd: getMoment().add(1, 'hour').format('HH:mm'),
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0074 - Should not create operation without enough user used daily limit by date', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, { userDailyLimit: 1500 });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await executeUseCase({
          ownerInfo,
          transactionTypeTag: transactionType.tag,
        });

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughAvailableLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
      });

      it('TC0075 - Should not create operation without enough user used monthly limit by date', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          userMonthlyLimit: 1500,
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await executeUseCase({
          ownerInfo,
          transactionTypeTag: transactionType.tag,
        });

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughAvailableLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
      });

      it('TC0076 - Should not create operation without enough user used yearly limit by date', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, { userYearlyLimit: 1500 });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await executeUseCase({
          ownerInfo,
          transactionTypeTag: transactionType.tag,
        });

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughAvailableLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
      });

      it('TC0077 - Should not create operation without enough user used nightly limit by date', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType, {
          tag: transactionType.tag,
          periodStart: LimitTypePeriodStart.DATE,
          check: LimitTypeCheck.OWNER,
        });
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          userNightlyLimit: 1500,
          nighttimeStart: getMoment().subtract(1, 'hour').format('HH:mm'),
          nighttimeEnd: getMoment().add(1, 'hour').format('HH:mm'),
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await executeUseCase({
          ownerInfo,
          transactionTypeTag: transactionType.tag,
        });

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughAvailableLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(1);
      });

      it('TC0078 - Should not create operation without user limit and global limit', async () => {
        const currency = await createCurrency();
        const { wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        await createLimitType(currency, transactionType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(DataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0079 - Should not create shared operation without owner info', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BOTH,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0080 - Should not create shared operation without beneficiary info', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.BOTH,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 0,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0081 - Should not create shared operation with null fee', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType({
          participants: TransactionTypeParticipants.OWNER,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: null,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0082 - Should not create operation above compliance max amount limit', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 20000,
          yearlyLimit: 30000,
          maxAmount: 100,
          minAmount: null,
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(ValueAboveMaxAmountLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0083 - Should not create operation above user defined max amount limit', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 20000,
          yearlyLimit: 30000,
          userMaxAmount: 100,
          minAmount: null,
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(ValueAboveMaxAmountLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0084 - Should not create operation above compliance max amount nightly limit', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 20000,
          yearlyLimit: 30000,
          maxAmountNightly: 100,
          minAmount: null,
          nighttimeStart: getMoment().subtract(1, 'hour').format('HH:mm'),
          nighttimeEnd: getMoment().add(1, 'hour').format('HH:mm'),
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(ValueAboveMaxAmountNightlyLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0085 - Should not create operation above user defined max amount nightly limit', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 20000,
          yearlyLimit: 30000,
          userMaxAmountNightly: 100,
          minAmount: null,
          nighttimeStart: getMoment().subtract(1, 'hour').format('HH:mm'),
          nighttimeEnd: getMoment().add(1, 'hour').format('HH:mm'),
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(ValueAboveMaxAmountNightlyLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0086 - Should not create operation under compliance min amount limit', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 20000,
          yearlyLimit: 30000,
          minAmount: 110,
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 90,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(ValueUnderMinAmountLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0087 - Should not create operation under user defined min amount limit', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 20000,
          yearlyLimit: 30000,
          userMinAmount: 110,
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 90,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(ValueUnderMinAmountLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0088 - Should not create operation under compliance min amount nightly limit', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 20000,
          yearlyLimit: 30000,
          minAmountNightly: 110,
          nighttimeStart: getMoment().subtract(1, 'hour').format('HH:mm'),
          nighttimeEnd: getMoment().add(1, 'hour').format('HH:mm'),
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 90,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(ValueUnderMinAmountNightlyLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0089 - Should not create operation under user defined min amount nightly limit', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency, {
          balance: 100000,
        });
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, {
          dailyLimit: 10000,
          monthlyLimit: 20000,
          yearlyLimit: 30000,
          userMinAmountNightly: 110,
          nighttimeStart: getMoment().subtract(1, 'hour').format('HH:mm'),
          nighttimeEnd: getMoment().add(1, 'hour').format('HH:mm'),
        });

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 90,
          fee: 10,
          description: 'Send PIX',
        };

        await expect(
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(ValueUnderMinAmountNightlyLimitException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0090 - Should not create operation without a valid owner info fee', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          rawValue: 1000,
          fee: -1,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(InvalidDataFormatException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0091 - Should not create operation without owner info raw value', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency,
          fee: 0,
          rawValue: null,
          description: 'Send PIX',
        };

        await expect(() =>
          executeUseCase({
            ownerInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(MissingDataException);
        expect(mockPendingOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0092 - Should not create when user has credit balance available and liability is GREATER than creditBalance ', async () => {
        const currency1 = await createCurrency('BTC', CurrencyState.ACTIVE, 6);
        const currency2 = await createCurrency();
        const { user, wallet, walletAccounts } = await createSameUser(
          [currency1, currency2],
          { balance: 0, pendingAmount: 0 },
        );
        const transactionType = await createTransactionType({ tag: 'CONV' });
        const limitType = await createLimitType(currency2, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, { creditBalance: 100 });
        const operationStreamQuotation =
          await OperationStreamQuotationFactory.create<OperationStreamQuotationEntity>(
            OperationStreamQuotationEntity.name,
            { baseCurrency: currency1, price: 5.0 },
          );

        mockGetOperationStreamQuotation.mockResolvedValue([
          operationStreamQuotation,
        ]);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency: currency1,
          rawValue: 100000000,
          fee: 1,
          description: 'Conversion withdrawal',
        };

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency: currency2,
          rawValue: 500,
          fee: 1,
          description: 'Conversion deposit',
        };

        const pendingWalletOwner =
          await PendingWalletAccountTransactionFactory.create<PendingWalletAccountTransactionEntity>(
            PendingWalletAccountTransactionEntity.name,
            {
              operation: ownerInfo.operation,
              value: -ownerInfo.rawValue,
              walletAccount: walletAccounts[0],
            },
          );

        const pendingWalletBeneficiary =
          await PendingWalletAccountTransactionFactory.create<PendingWalletAccountTransactionEntity>(
            PendingWalletAccountTransactionEntity.name,
            {
              operation: beneficiaryInfo.operation,
              value: beneficiaryInfo.rawValue,
              walletAccount: walletAccounts[1],
            },
          );

        mockGetPendingWalletAccountTransaction
          .mockReturnValueOnce([pendingWalletOwner])
          .mockReturnValueOnce([pendingWalletBeneficiary]);

        await expect(
          executeUseCase({
            ownerInfo,
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(NotEnoughFundsException);
        expect(mockCreatePendingWalletAccountTransaction).toHaveBeenCalledTimes(
          2,
        );
        expect(mockUpdatePendingWalletAccountTransaction).toHaveBeenCalledTimes(
          2,
        );
        expect(mockGetPendingWalletAccountTransaction).toHaveBeenCalledTimes(2);
        expect(mockGetOperationStreamQuotation).toHaveBeenCalledTimes(1);
      });

      it('TC0093 - Should not create when user has credit balance but operation stream quotation has no data', async () => {
        const currency1 = await createCurrency('BTC');
        const currency2 = await createCurrency();
        const { user, wallet, walletAccounts } = await createSameUser(
          [currency1, currency2],
          { balance: 0, pendingAmount: 0 },
        );
        const transactionType = await createTransactionType({ tag: 'CONV' });
        const limitType = await createLimitType(currency2, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType, { creditBalance: 100 });

        mockGetOperationStreamQuotation.mockResolvedValue([]);

        const ownerInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency: currency1,
          rawValue: 10,
          fee: 1,
          description: 'Conversion withdrawal',
        };

        const beneficiaryInfo: CreateOperationParticipant = {
          operation: new OperationEntity({ id: faker.datatype.uuid() }),
          wallet,
          currency: currency2,
          rawValue: 50,
          fee: 1,
          description: 'Conversion deposit',
        };

        const pendingWalletOwner =
          await PendingWalletAccountTransactionFactory.create<PendingWalletAccountTransactionEntity>(
            PendingWalletAccountTransactionEntity.name,
            {
              operation: ownerInfo.operation,
              value: -ownerInfo.rawValue,
              walletAccount: walletAccounts[0],
            },
          );

        const pendingWalletBeneficiary =
          await PendingWalletAccountTransactionFactory.create<PendingWalletAccountTransactionEntity>(
            PendingWalletAccountTransactionEntity.name,
            {
              operation: beneficiaryInfo.operation,
              value: beneficiaryInfo.rawValue,
              walletAccount: walletAccounts[1],
            },
          );

        mockGetPendingWalletAccountTransaction
          .mockReturnValueOnce([pendingWalletOwner])
          .mockReturnValueOnce([pendingWalletBeneficiary]);

        await expect(
          executeUseCase({
            ownerInfo,
            beneficiaryInfo,
            transactionTypeTag: transactionType.tag,
          }),
        ).rejects.toThrow(StreamQuotationNotFoundException);
        expect(mockCreatePendingWalletAccountTransaction).toHaveBeenCalledTimes(
          2,
        );
        expect(mockUpdatePendingWalletAccountTransaction).toHaveBeenCalledTimes(
          2,
        );
        expect(mockGetPendingWalletAccountTransaction).toHaveBeenCalledTimes(1);
        expect(mockGetOperationStreamQuotation).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
