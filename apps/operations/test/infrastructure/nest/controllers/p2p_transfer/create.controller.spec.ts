import { createMock } from 'ts-auto-mock';
import { On, method } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Sequelize } from 'sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  defaultLogger as logger,
  DATABASE_PROVIDER,
  RedisService,
} from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  TransactionTypeParticipants,
  LimitTypeCheck,
  LimitTypePeriodStart,
  TransactionTypeState,
  LimitType,
  Wallet,
  WalletAccount,
  WalletState,
} from '@zro/operations/domain';
import {
  WalletAccountModel,
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
  WalletAccountDatabaseRepository,
  CreateP2PTransferMicroserviceController as Controller,
  WalletAccountTransactionDatabaseRepository,
  WalletAccountCacheDatabaseRepository,
  WalletDatabaseRepository,
  P2PTransferDatabaseRepository,
  UserLimitTrackerDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  CreateP2PTransferRequest,
  CreateP2PTransferResponse,
  OperationEventEmitterControllerInterface,
  UserLimitEventEmitterControllerInterface,
} from '@zro/operations/interface';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { UserFactory } from '@zro/test/users/config';
import {
  CurrencyFactory,
  WalletFactory,
  WalletAccountFactory,
  TransactionTypeFactory,
  LimitTypeFactory,
  GlobalLimitFactory,
  UserLimitFactory,
} from '@zro/test/operations/config';

/**
 * Test create operation use case.
 */
describe('Testing create operation use case.', () => {
  let controller: Controller;
  let sequelize: Sequelize;
  let module: TestingModule;

  const operationEventEmitter: OperationEventEmitterControllerInterface =
    createMock<OperationEventEmitterControllerInterface>();
  const mockEmitOperationEventEmitter: jest.Mock = On(
    operationEventEmitter,
  ).get(method((mock) => mock.emitOperationEvent));

  const userLimitEventEmitter: UserLimitEventEmitterControllerInterface =
    createMock<UserLimitEventEmitterControllerInterface>();

  const redisService: RedisService = createMock<RedisService>();

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

  const createLimitType = async (
    currency: CurrencyModel,
    transactionType: TransactionTypeModel,
    { tag, periodStart, check, nighttimeStart, nighttimeEnd }: any = {},
  ): Promise<LimitTypeModel> => {
    const attrs: any = {
      tag: tag ?? transactionType.tag,
      periodStart: periodStart ?? LimitTypePeriodStart.DATE,
      check: check ?? LimitTypeCheck.OWNER,
      nighttimeStart: nighttimeStart ?? null,
      nighttimeEnd: nighttimeEnd ?? null,
      currencyId: currency.id,
      transactionTypeId: transactionType.id,
    };

    const found = await LimitTypeModel.findOne({
      where: { tag: attrs.tag },
    });

    return (
      found ??
      LimitTypeFactory.create<LimitTypeModel>(LimitTypeModel.name, attrs)
    );
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
    }: any = {
      nightlyLimit: 10000,
      dailyLimit: 10000,
      monthlyLimit: 20000,
      yearlyLimit: 30000,
      maxAmount: null,
      minAmount: null,
    },
  ): Promise<GlobalLimitModel> => {
    return GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      nightlyLimit,
      dailyLimit,
      monthlyLimit,
      yearlyLimit,
      maxAmount,
      minAmount,
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
    }: any = {
      nightlyLimit: 10000,
      dailyLimit: 10000,
      monthlyLimit: 20000,
      yearlyLimit: 30000,
      maxAmount: null,
      minAmount: null,
    },
  ): Promise<UserLimitModel> => {
    return UserLimitFactory.create<UserLimitModel>(UserLimitModel.name, {
      userId: user.id,
      limitTypeId: limitType.id,
      nightlyLimit,
      dailyLimit,
      monthlyLimit,
      yearlyLimit,
      maxAmount,
      minAmount,
    });
  };

  interface CreatedUser {
    user: User;
    wallet: Wallet;
    walletAccount: WalletAccount;
  }

  const createUser = async (currency: CurrencyModel): Promise<CreatedUser> => {
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
      },
    );

    return { user, wallet, walletAccount };
  };

  const executeController = async (
    request: CreateP2PTransferRequest,
  ): Promise<CreateP2PTransferResponse> => {
    const transaction = await sequelize.transaction();

    try {
      const p2pTransferRepository = new P2PTransferDatabaseRepository(
        transaction,
      );
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
      const walletAccountTransactionRepository =
        new WalletAccountTransactionDatabaseRepository(transaction);
      const walletAccountCacheRepository =
        new WalletAccountCacheDatabaseRepository(transaction);
      const userLimitTrackerRepository = new UserLimitTrackerDatabaseRepository(
        transaction,
      );

      const message: CreateP2PTransferRequest = {
        id: request.id,
        userId: request.userId,
        walletId: request.walletId,
        beneficiaryWalletId: request.beneficiaryWalletId,
        amountCurrencySymbol: request.amountCurrencySymbol,
        amount: request.amount,
        fee: request.fee,
        description: request.description,
      };

      const operation = await controller.execute(
        p2pTransferRepository,
        transactionTypeRepository,
        currencyRepository,
        walletRepository,
        walletAccountRepository,
        operationRepository,
        limitTypeRepository,
        userLimitRepository,
        globalLimitRepository,
        walletAccountTransactionRepository,
        walletAccountCacheRepository,
        operationEventEmitter,
        userLimitEventEmitter,
        userLimitTrackerRepository,
        logger,
        message,
        ctx,
      );

      await transaction.commit();

      return operation.value;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(RedisService)
      .useValue(redisService)
      .compile();
    controller = module.get<Controller>(Controller);
    sequelize = module.get(DATABASE_PROVIDER);
  });

  beforeEach(jest.resetAllMocks);

  describe('CreateP2PTransfer', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create P2PTransfer successfully', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const { wallet: beneficiaryWallet } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const message = {
          id: faker.datatype.uuid(),
          userId: user.uuid,
          walletId: wallet.uuid,
          beneficiaryWalletId: beneficiaryWallet.uuid,
          amountCurrencySymbol: currency.symbol,
          amount: 10,
        };

        const result = await executeController(message);

        expect(result).toBeDefined();
        expect(result.id).toBe(message.id);
        expect(result.amount).toBe(message.amount);
        expect(result.description).toBeDefined();
        expect(result.fee).toBeDefined();
        expect(result.createdAt).toBeDefined();
        expect(result.operationId).toBeDefined();
        expect(result.amountCurrencySymbol).toBeDefined();
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(2);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
