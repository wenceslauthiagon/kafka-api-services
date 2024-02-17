import { createMock } from 'ts-auto-mock';
import { On, method } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Sequelize } from 'sequelize';
import { Test, TestingModule } from '@nestjs/testing';
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
  OperationState,
  TransactionTypeState,
  LimitType,
  Wallet,
  WalletAccount,
  WalletState,
  WalletAccountState,
} from '@zro/operations/domain';
import {
  TransactionTypeTagNotFoundException,
  WalletNotFoundException,
} from '@zro/operations/application';
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
  WalletAccountDatabaseRepository,
  CreateAndAcceptOperationMicroserviceController as Controller,
  UserServiceKafka,
  WalletAccountTransactionDatabaseRepository,
  WalletAccountCacheDatabaseRepository,
  WalletDatabaseRepository,
  UserLimitTrackerDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  CreateAndAcceptOperationRequest,
  CreateAndAcceptOperationResponse,
  OperationEventEmitterControllerInterface,
  OperationEventType,
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
import { KafkaContext } from '@nestjs/microservices';

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

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserByUuidService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

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
    };

    const found = await LimitTypeModel.findOne({
      where: { tag: attrs.tag },
    });

    const limitType =
      found ??
      (await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
        attrs,
      ));

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

  const executeController = async (
    request: CreateAndAcceptOperationRequest,
  ): Promise<CreateAndAcceptOperationResponse> => {
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
      const walletAccountTransactionRepository =
        new WalletAccountTransactionDatabaseRepository(transaction);
      const walletAccountCacheRepository =
        new WalletAccountCacheDatabaseRepository(transaction);
      const userLimitTrackerRepository = new UserLimitTrackerDatabaseRepository(
        transaction,
      );

      const message: CreateAndAcceptOperationRequest = {
        owner: request.owner,
        beneficiary: request.beneficiary,
        transactionTag: request.transactionTag,
      };

      const operation = await controller.execute(
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

  describe('Create operation', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create an owner operation successfully', async () => {
        const currency = await createCurrency();
        const { user, wallet, walletAccount } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const operation = {
          owner: {
            operationId: faker.datatype.uuid(),
            walletId: wallet.uuid,
            currencyTag: currency.tag,
            rawValue: 1000,
            fee: 0,
            description: 'Send PIX',
          },
          transactionTag: transactionType.tag,
        };

        mockGetUserByUuidService.mockReturnValueOnce(user);

        const response = await executeController(operation);

        const value = operation.owner.rawValue + operation.owner.fee;

        const { owner: ownerOperation, beneficiary: beneficiaryOperation } =
          response;

        expect(ownerOperation).not.toBeNull();
        expect(beneficiaryOperation).toBeNull();

        expect(ownerOperation.operation.id).not.toBeNull();
        expect(ownerOperation.operation.rawValue).toBe(
          operation.owner.rawValue,
        );
        expect(ownerOperation.operation.value).toBe(value);
        expect(ownerOperation.operation.fee).toBe(operation.owner.fee);
        expect(ownerOperation.operation.description).toBe(
          operation.owner.description,
        );
        expect(ownerOperation.operation.transactionId).toBe(transactionType.id);
        expect(ownerOperation.operation.createdAt).not.toBeNull();
        expect(ownerOperation.operation.state).toBe(OperationState.ACCEPTED);
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(2);
        expect(mockEmitOperationEventEmitter.mock.calls[0][0]).toBe(
          OperationEventType.PENDING,
        );
        expect(mockEmitOperationEventEmitter.mock.calls[0][1]).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].ownerOperation.ownerId,
        ).toBe(user.id);
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].beneficiaryOperation,
        ).toBeNull();
        expect(mockEmitOperationEventEmitter.mock.calls[1][0]).toBe(
          OperationEventType.ACCEPTED,
        );
        expect(mockEmitOperationEventEmitter.mock.calls[1][1]).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[1][1].ownerOperation.ownerId,
        ).toBe(user.id);
        expect(
          mockEmitOperationEventEmitter.mock.calls[1][1].beneficiaryOperation,
        ).toBeNull();

        const createdOwnerOperation = await OperationModel.findOne({
          where: { id: ownerOperation.operation.id },
        });

        expect(createdOwnerOperation).not.toBeNull();
        expect(createdOwnerOperation.rawValue).toBe(operation.owner.rawValue);
        expect(createdOwnerOperation.value).toBe(value);
        expect(createdOwnerOperation.fee).toBe(operation.owner.fee);
        expect(createdOwnerOperation.description).toBe(
          operation.owner.description,
        );
        expect(createdOwnerOperation.transactionTypeId).toBe(
          transactionType.id,
        );
        expect(createdOwnerOperation.currencyId).toBe(currency.id);
        expect(createdOwnerOperation.operationRefId).toBeNull();
        expect(createdOwnerOperation.state).toBe(OperationState.ACCEPTED);

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
          walletAccount.pendingAmount,
        );
      });

      it('TC0002 - Should create an beneficiary operation successfully', async () => {
        const currency = await createCurrency();
        const { user, wallet, walletAccount } = await createUser(currency);
        const transactionType = await createTransactionType({
          tag: 'PIXRECEIVE',
          participants: TransactionTypeParticipants.BENEFICIARY,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const operation = {
          beneficiary: {
            operationId: faker.datatype.uuid(),
            walletId: wallet.uuid,
            currencyTag: currency.tag,
            rawValue: 1000,
            fee: 0,
            description: 'Send PIX',
          },
          transactionTag: transactionType.tag,
        };

        mockGetUserByUuidService.mockReturnValueOnce(user);

        const response = await executeController(operation);

        const value =
          operation.beneficiary.rawValue - operation.beneficiary.fee;

        const { owner: ownerOperation, beneficiary: beneficiaryOperation } =
          response;

        expect(ownerOperation).toBeNull();
        expect(beneficiaryOperation).not.toBeNull();

        expect(beneficiaryOperation.operation.id).not.toBeNull();
        expect(beneficiaryOperation.operation.rawValue).toBe(
          operation.beneficiary.rawValue,
        );
        expect(beneficiaryOperation.operation.value).toBe(value);
        expect(beneficiaryOperation.operation.fee).toBe(
          operation.beneficiary.fee,
        );
        expect(beneficiaryOperation.operation.description).toBe(
          operation.beneficiary.description,
        );
        expect(beneficiaryOperation.operation.transactionId).toBe(
          transactionType.id,
        );
        expect(beneficiaryOperation.operation.createdAt).not.toBeNull();
        expect(beneficiaryOperation.operation.state).toBe(
          OperationState.ACCEPTED,
        );
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(2);
        expect(mockEmitOperationEventEmitter.mock.calls[0][0]).toBe(
          OperationEventType.PENDING,
        );
        expect(mockEmitOperationEventEmitter.mock.calls[0][1]).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].ownerOperation,
        ).toBeNull();
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].beneficiaryOperation
            .beneficiaryId,
        ).toBe(user.id);
        expect(mockEmitOperationEventEmitter.mock.calls[1][0]).toBe(
          OperationEventType.ACCEPTED,
        );
        expect(mockEmitOperationEventEmitter.mock.calls[1][1]).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[1][1].beneficiaryOperation
            .beneficiaryId,
        ).toBe(user.id);
        expect(
          mockEmitOperationEventEmitter.mock.calls[1][1].ownerOperation,
        ).toBeNull();

        const createdBeneficiaryOperation = await OperationModel.findOne({
          where: { id: beneficiaryOperation.operation.id },
        });

        expect(createdBeneficiaryOperation).not.toBeNull();
        expect(createdBeneficiaryOperation.rawValue).toBe(
          operation.beneficiary.rawValue,
        );
        expect(createdBeneficiaryOperation.value).toBe(value);
        expect(createdBeneficiaryOperation.fee).toBe(operation.beneficiary.fee);
        expect(createdBeneficiaryOperation.description).toBe(
          operation.beneficiary.description,
        );
        expect(createdBeneficiaryOperation.transactionTypeId).toBe(
          transactionType.id,
        );
        expect(createdBeneficiaryOperation.currencyId).toBe(currency.id);
        expect(createdBeneficiaryOperation.operationRefId).toBeNull();
        expect(createdBeneficiaryOperation.state).toBe(OperationState.ACCEPTED);

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

        const updatedWalletAccount = await WalletAccountModel.findOne({
          where: { id: walletAccount.id },
        });

        expect(updatedWalletAccount).not.toBeNull();
        expect(updatedWalletAccount.balance).toBe(
          walletAccount.balance + value,
        );
        expect(updatedWalletAccount.pendingAmount).toBe(
          walletAccount.pendingAmount,
        );
      });

      it('TC0003 - Should create an owner operation when ownerAllowAvailableRawValue is TRUE and balance is LESS than rawValue + fee successfully', async () => {
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

        const operation = {
          owner: {
            operationId: faker.datatype.uuid(),
            walletId: wallet.uuid,
            currencyTag: currency.tag,
            rawValue: originalRawValue,
            fee: originalFee,
            description: 'Send PIXREFUND',
            ownerAllowAvailableRawValue: true,
          },
          transactionTag: transactionType.tag,
        };

        mockGetUserByUuidService.mockReturnValueOnce(user);

        const response = await executeController(operation);

        const newRawValue = walletAccount.balance - operation.owner.fee;
        const newFee = operation.owner.fee;
        const value = newRawValue + newFee;

        const { owner: ownerOperation, beneficiary: beneficiaryOperation } =
          response;

        expect(ownerOperation).not.toBeNull();
        expect(beneficiaryOperation).toBeNull();

        expect(ownerOperation.operation.id).not.toBeNull();
        expect(ownerOperation.operation.rawValue).toBe(newRawValue);
        expect(ownerOperation.operation.value).toBe(value);
        expect(ownerOperation.operation.fee).toBe(newFee);
        expect(ownerOperation.operation.description).toBe(
          operation.owner.description,
        );
        expect(ownerOperation.operation.transactionId).toBe(transactionType.id);
        expect(ownerOperation.operation.createdAt).not.toBeNull();
        expect(ownerOperation.operation.state).toBe(OperationState.ACCEPTED);
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(2);
        expect(mockEmitOperationEventEmitter.mock.calls[0][0]).toBe(
          OperationEventType.PENDING,
        );
        expect(mockEmitOperationEventEmitter.mock.calls[0][1]).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].ownerOperation.ownerId,
        ).toBe(user.id);
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].beneficiaryOperation,
        ).toBeNull();
        expect(mockEmitOperationEventEmitter.mock.calls[1][0]).toBe(
          OperationEventType.ACCEPTED,
        );
        expect(mockEmitOperationEventEmitter.mock.calls[1][1]).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[1][1].ownerOperation.ownerId,
        ).toBe(user.id);
        expect(
          mockEmitOperationEventEmitter.mock.calls[1][1].beneficiaryOperation,
        ).toBeNull();

        const createdOwnerOperation = await OperationModel.findOne({
          where: { id: ownerOperation.operation.id },
        });

        expect(createdOwnerOperation).not.toBeNull();
        expect(createdOwnerOperation.rawValue).toBe(newRawValue);
        expect(createdOwnerOperation.value).toBe(value);
        expect(createdOwnerOperation.fee).toBe(newFee);
        expect(createdOwnerOperation.description).toBe(
          operation.owner.description,
        );
        expect(createdOwnerOperation.transactionTypeId).toBe(
          transactionType.id,
        );
        expect(createdOwnerOperation.currencyId).toBe(currency.id);
        expect(createdOwnerOperation.operationRefId).toBeNull();
        expect(createdOwnerOperation.state).toBe(OperationState.ACCEPTED);

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
        expect(createdOwnerOperation.ownerRequestedRawValue).toBe(
          originalRawValue,
        );
        expect(createdOwnerOperation.ownerRequestedFee).toBe(originalFee);

        const updatedWalletAccount = await WalletAccountModel.findOne({
          where: { id: walletAccount.id },
        });

        expect(updatedWalletAccount).not.toBeNull();
        expect(updatedWalletAccount.balance).toBe(
          walletAccount.balance - value,
        );
        expect(updatedWalletAccount.pendingAmount).toBe(
          walletAccount.pendingAmount,
        );
      });

      it('TC0004 - Should create just one operation with beneficiary and owner successfully', async () => {
        const currency = await createCurrency();
        const {
          user: owner,
          wallet: walletOwner,
          walletAccount: walletAccountOwner,
        } = await createUser(currency);
        const {
          user: beneficiary,
          wallet: walletBeneficiary,
          walletAccount: walletAccountBeneficiary,
        } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(owner, limitType);

        const operationId = faker.datatype.uuid();
        const operation = {
          beneficiary: {
            currencyTag: currency.tag,
            description: 'Send PIX P2P',
            fee: 0,
            operationId,
            rawValue: 1000,
            walletId: walletBeneficiary.uuid,
          },
          owner: {
            currencyTag: currency.tag,
            description: 'Send PIX P2P',
            fee: 0,
            operationId,
            rawValue: 1000,
            walletId: walletOwner.uuid,
          },
          transactionTag: transactionType.tag,
        };

        mockGetUserByUuidService.mockReturnValueOnce(owner);
        mockGetUserByUuidService.mockReturnValueOnce(beneficiary);

        const response = await executeController(operation);

        const value = operation.owner.rawValue + operation.owner.fee;

        const { owner: ownerOperation, beneficiary: beneficiaryOperation } =
          response;

        expect(ownerOperation).not.toBeNull();
        expect(beneficiaryOperation).not.toBeNull();

        expect(ownerOperation.operation.id).not.toBeNull();
        expect(beneficiaryOperation.operation.id).not.toBeNull();
        expect(ownerOperation.operation.rawValue).toBe(
          operation.owner.rawValue,
        );
        expect(beneficiaryOperation.operation.rawValue).toBe(
          operation.beneficiary.rawValue,
        );
        expect(ownerOperation.operation.value).toBe(value);
        expect(beneficiaryOperation.operation.value).toBe(value);
        expect(ownerOperation.operation.fee).toBe(operation.owner.fee);
        expect(beneficiaryOperation.operation.fee).toBe(
          operation.beneficiary.fee,
        );
        expect(ownerOperation.operation.description).toBe(
          operation.owner.description,
        );
        expect(beneficiaryOperation.operation.description).toBe(
          operation.beneficiary.description,
        );
        expect(ownerOperation.operation.transactionId).toBe(transactionType.id);
        expect(beneficiaryOperation.operation.transactionId).toBe(
          transactionType.id,
        );
        expect(ownerOperation.operation.createdAt).not.toBeNull();
        expect(beneficiaryOperation.operation.createdAt).not.toBeNull();
        expect(ownerOperation.operation.state).toBe(OperationState.ACCEPTED);
        expect(beneficiaryOperation.operation.state).toBe(
          OperationState.ACCEPTED,
        );
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(2);
        expect(mockEmitOperationEventEmitter.mock.calls[0][0]).toBe(
          OperationEventType.PENDING,
        );
        expect(mockEmitOperationEventEmitter.mock.calls[0][1]).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].ownerOperation.ownerId,
        ).toBe(owner.id);
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].beneficiaryOperation
            .beneficiaryId,
        ).toBe(beneficiary.id);
        expect(mockEmitOperationEventEmitter.mock.calls[1][0]).toBe(
          OperationEventType.ACCEPTED,
        );

        const createdOwnerOperation = await OperationModel.findOne({
          where: { id: ownerOperation.operation.id },
        });
        expect(createdOwnerOperation).not.toBeNull();
        expect(createdOwnerOperation.rawValue).toBe(operation.owner.rawValue);
        expect(createdOwnerOperation.value).toBe(value);
        expect(createdOwnerOperation.fee).toBe(operation.owner.fee);
        expect(createdOwnerOperation.description).toBe(
          operation.owner.description,
        );
        expect(createdOwnerOperation.transactionTypeId).toBe(
          transactionType.id,
        );
        expect(createdOwnerOperation.currencyId).toBe(currency.id);
        expect(createdOwnerOperation.operationRefId).toBeNull();
        expect(createdOwnerOperation.state).toBe(OperationState.ACCEPTED);

        expect(createdOwnerOperation.ownerId).not.toBeNull();
        expect(createdOwnerOperation.ownerWalletAccountId).not.toBeNull();
        expect(createdOwnerOperation.beneficiaryId).not.toBeNull();
        expect(createdOwnerOperation.beneficiaryWalletAccountId).not.toBeNull();

        expect(createdOwnerOperation.ownerId).toBe(owner.id);
        expect(createdOwnerOperation.ownerWalletAccountId).toBe(
          walletAccountOwner.id,
        );
        expect(createdOwnerOperation.beneficiaryId).toBe(beneficiary.id);
        expect(createdOwnerOperation.beneficiaryWalletAccountId).toBe(
          walletAccountBeneficiary.id,
        );

        const createdBeneficiaryOperation = await OperationModel.findOne({
          where: { id: beneficiaryOperation.operation.id },
        });
        expect(createdBeneficiaryOperation).not.toBeNull();
        expect(createdBeneficiaryOperation.rawValue).toBe(
          operation.beneficiary.rawValue,
        );
        expect(createdBeneficiaryOperation.value).toBe(value);
        expect(createdBeneficiaryOperation.fee).toBe(operation.beneficiary.fee);
        expect(createdBeneficiaryOperation.description).toBe(
          operation.beneficiary.description,
        );
        expect(createdBeneficiaryOperation.transactionTypeId).toBe(
          transactionType.id,
        );
        expect(createdBeneficiaryOperation.currencyId).toBe(currency.id);
        expect(createdBeneficiaryOperation.operationRefId).toBeNull();
        expect(createdBeneficiaryOperation.state).toBe(OperationState.ACCEPTED);

        expect(createdBeneficiaryOperation.beneficiaryId).not.toBeNull();
        expect(
          createdBeneficiaryOperation.beneficiaryWalletAccountId,
        ).not.toBeNull();
        expect(createdBeneficiaryOperation.beneficiaryId).not.toBeNull();
        expect(
          createdBeneficiaryOperation.beneficiaryWalletAccountId,
        ).not.toBeNull();

        expect(createdBeneficiaryOperation.beneficiaryId).toBe(beneficiary.id);
        expect(createdBeneficiaryOperation.beneficiaryWalletAccountId).toBe(
          walletAccountBeneficiary.id,
        );
        expect(createdBeneficiaryOperation.beneficiaryId).toBe(beneficiary.id);
        expect(createdBeneficiaryOperation.beneficiaryWalletAccountId).toBe(
          walletAccountBeneficiary.id,
        );

        const updatedWalletAccountOwner = await WalletAccountModel.findOne({
          where: { id: walletAccountOwner.id },
        });
        expect(updatedWalletAccountOwner).not.toBeNull();
        expect(updatedWalletAccountOwner.balance).toBe(
          walletAccountOwner.balance - value,
        );
        expect(updatedWalletAccountOwner.pendingAmount).toBe(
          walletAccountOwner.pendingAmount,
        );

        const updatedWalletAccountBeneficiary =
          await WalletAccountModel.findOne({
            where: { id: walletAccountBeneficiary.id },
          });
        expect(updatedWalletAccountBeneficiary).not.toBeNull();
        expect(updatedWalletAccountBeneficiary.balance).toBe(
          walletAccountBeneficiary.balance + value,
        );
        expect(updatedWalletAccountBeneficiary.pendingAmount).toBe(
          walletAccountBeneficiary.pendingAmount,
        );
      });

      it('TC0005 - Should create beneficiary and owner operations successfully', async () => {
        const currencyReal = await createCurrency('REAL');
        const currencyBTC = await createCurrency('BTC');
        const {
          user: owner,
          wallet: walletOwner,
          walletAccount: walletAccountOwner,
        } = await createUser(currencyReal);
        const {
          user: beneficiary,
          wallet: walletBeneficiary,
          walletAccount: walletAccountBeneficiary,
        } = await createUser(currencyBTC);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currencyReal, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(owner, limitType);

        const operation = {
          beneficiary: {
            currencyTag: currencyBTC.tag,
            description: 'Send PIX',
            fee: 0,
            operationId: faker.datatype.uuid(),
            rawValue: 1000,
            walletId: walletBeneficiary.uuid,
          },
          owner: {
            currencyTag: currencyReal.tag,
            description: 'Send PIX',
            fee: 0,
            operationId: faker.datatype.uuid(),
            rawValue: 2000,
            walletId: walletOwner.uuid,
          },
          transactionTag: transactionType.tag,
        };

        mockGetUserByUuidService.mockReturnValueOnce(owner);
        mockGetUserByUuidService.mockReturnValueOnce(beneficiary);

        const response = await executeController(operation);

        const ownerValue = operation.owner.rawValue + operation.owner.fee;
        const beneficiaryValue =
          operation.beneficiary.rawValue + operation.beneficiary.fee;

        const { owner: ownerOperation, beneficiary: beneficiaryOperation } =
          response;

        expect(ownerOperation).not.toBeNull();
        expect(beneficiaryOperation).not.toBeNull();

        expect(ownerOperation.operation.id).not.toBeNull();
        expect(beneficiaryOperation.operation.id).not.toBeNull();
        expect(ownerOperation.operation.rawValue).toBe(
          operation.owner.rawValue,
        );
        expect(beneficiaryOperation.operation.rawValue).toBe(
          operation.beneficiary.rawValue,
        );
        expect(ownerOperation.operation.value).toBe(ownerValue);
        expect(beneficiaryOperation.operation.value).toBe(beneficiaryValue);
        expect(ownerOperation.operation.fee).toBe(operation.owner.fee);
        expect(beneficiaryOperation.operation.fee).toBe(
          operation.beneficiary.fee,
        );
        expect(ownerOperation.operation.description).toBe(
          operation.owner.description,
        );
        expect(beneficiaryOperation.operation.description).toBe(
          operation.beneficiary.description,
        );
        expect(ownerOperation.operation.transactionId).toBe(transactionType.id);
        expect(beneficiaryOperation.operation.transactionId).toBe(
          transactionType.id,
        );
        expect(ownerOperation.operation.createdAt).not.toBeNull();
        expect(beneficiaryOperation.operation.createdAt).not.toBeNull();
        expect(ownerOperation.operation.state).toBe(OperationState.ACCEPTED);
        expect(beneficiaryOperation.operation.state).toBe(
          OperationState.ACCEPTED,
        );
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(3);

        expect(mockEmitOperationEventEmitter.mock.calls[0][0]).toBe(
          OperationEventType.PENDING,
        );
        expect(mockEmitOperationEventEmitter.mock.calls[0][1]).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].ownerOperation,
        ).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].ownerOperation.ownerId,
        ).toBe(owner.id);
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].beneficiaryOperation,
        ).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].beneficiaryOperation
            .beneficiaryId,
        ).toBe(beneficiary.id);

        expect(mockEmitOperationEventEmitter.mock.calls[1][0]).toBe(
          OperationEventType.ACCEPTED,
        );
        expect(mockEmitOperationEventEmitter.mock.calls[1][1]).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[1][1].ownerOperation,
        ).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[1][1].ownerOperation.ownerId,
        ).toBe(owner.id);
        expect(
          mockEmitOperationEventEmitter.mock.calls[1][1].beneficiaryOperation,
        ).toBeNull();

        expect(mockEmitOperationEventEmitter.mock.calls[2][0]).toBe(
          OperationEventType.ACCEPTED,
        );
        expect(mockEmitOperationEventEmitter.mock.calls[2][1]).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[2][1].ownerOperation,
        ).toBeNull();
        expect(
          mockEmitOperationEventEmitter.mock.calls[2][1].beneficiaryOperation,
        ).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[2][1].beneficiaryOperation
            .beneficiaryId,
        ).toBe(beneficiary.id);

        const createdOwnerOperation = await OperationModel.findOne({
          where: { id: ownerOperation.operation.id },
        });
        expect(createdOwnerOperation).not.toBeNull();
        expect(createdOwnerOperation.rawValue).toBe(operation.owner.rawValue);
        expect(createdOwnerOperation.value).toBe(ownerValue);
        expect(createdOwnerOperation.fee).toBe(operation.owner.fee);
        expect(createdOwnerOperation.description).toBe(
          operation.owner.description,
        );
        expect(createdOwnerOperation.transactionTypeId).toBe(
          transactionType.id,
        );
        expect(createdOwnerOperation.currencyId).toBe(currencyReal.id);
        expect(createdOwnerOperation.operationRefId).toBe(
          operation.beneficiary.operationId,
        );
        expect(createdOwnerOperation.state).toBe(OperationState.ACCEPTED);

        expect(createdOwnerOperation.ownerId).not.toBeNull();
        expect(createdOwnerOperation.ownerWalletAccountId).not.toBeNull();
        expect(createdOwnerOperation.beneficiaryId).not.toBeNull();
        expect(createdOwnerOperation.beneficiaryWalletAccountId).not.toBeNull();

        expect(createdOwnerOperation.ownerId).toBe(owner.id);
        expect(createdOwnerOperation.ownerWalletAccountId).toBe(
          walletAccountOwner.id,
        );
        expect(createdOwnerOperation.beneficiaryId).toBe(0);
        expect(createdOwnerOperation.beneficiaryWalletAccountId).toBe(0);

        const createdBeneficiaryOperation = await OperationModel.findOne({
          where: { id: beneficiaryOperation.operation.id },
        });
        expect(createdBeneficiaryOperation).not.toBeNull();
        expect(createdBeneficiaryOperation.rawValue).toBe(
          operation.beneficiary.rawValue,
        );
        expect(createdBeneficiaryOperation.value).toBe(beneficiaryValue);
        expect(createdBeneficiaryOperation.fee).toBe(operation.beneficiary.fee);
        expect(createdBeneficiaryOperation.description).toBe(
          operation.beneficiary.description,
        );
        expect(createdBeneficiaryOperation.transactionTypeId).toBe(
          transactionType.id,
        );
        expect(createdBeneficiaryOperation.currencyId).toBe(currencyBTC.id);
        expect(createdBeneficiaryOperation.operationRefId).toBe(
          operation.owner.operationId,
        );
        expect(createdBeneficiaryOperation.state).toBe(OperationState.ACCEPTED);

        expect(createdBeneficiaryOperation.beneficiaryId).not.toBeNull();
        expect(
          createdBeneficiaryOperation.beneficiaryWalletAccountId,
        ).not.toBeNull();
        expect(createdBeneficiaryOperation.beneficiaryId).not.toBeNull();
        expect(
          createdBeneficiaryOperation.beneficiaryWalletAccountId,
        ).not.toBeNull();

        expect(createdBeneficiaryOperation.beneficiaryId).toBe(beneficiary.id);
        expect(createdBeneficiaryOperation.beneficiaryWalletAccountId).toBe(
          walletAccountBeneficiary.id,
        );
        expect(createdBeneficiaryOperation.beneficiaryId).toBe(beneficiary.id);
        expect(createdBeneficiaryOperation.beneficiaryWalletAccountId).toBe(
          walletAccountBeneficiary.id,
        );

        const updatedWalletAccountOwner = await WalletAccountModel.findOne({
          where: { id: walletAccountOwner.id },
        });

        expect(updatedWalletAccountOwner).not.toBeNull();
        expect(updatedWalletAccountOwner.balance).toBe(
          walletAccountOwner.balance - ownerValue,
        );
        expect(updatedWalletAccountOwner.pendingAmount).toBe(
          walletAccountOwner.pendingAmount,
        );

        const updatedWalletAccountBeneficiary =
          await WalletAccountModel.findOne({
            where: { id: walletAccountBeneficiary.id },
          });
        expect(updatedWalletAccountBeneficiary).not.toBeNull();
        expect(updatedWalletAccountBeneficiary.balance).toBe(
          walletAccountBeneficiary.balance + beneficiaryValue,
        );
        expect(updatedWalletAccountBeneficiary.pendingAmount).toBe(
          walletAccountBeneficiary.pendingAmount,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0006 - Should not create an owner operation with invalid transaction tag', async () => {
        const currency = await createCurrency();
        const { user, wallet } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const operation = {
          owner: {
            operationId: faker.datatype.uuid(),
            walletId: wallet.uuid,
            currencyTag: currency.tag,
            rawValue: 1000,
            fee: 0,
            description: 'Send PIX',
          },
          transactionTag: 'XXXXXX',
        };

        mockGetUserByUuidService.mockReturnValueOnce(user);

        await expect(() => executeController(operation)).rejects.toThrow(
          TransactionTypeTagNotFoundException,
        );
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0007 - Should not create an owner operation with invalid onwer wallet account id', async () => {
        const currency = await createCurrency();
        const { user } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const operation = {
          owner: {
            operationId: faker.datatype.uuid(),
            walletId: faker.datatype.uuid(),
            currencyTag: currency.tag,
            rawValue: 1000,
            fee: 0,
            description: 'Send PIX',
          },
          transactionTag: transactionType.tag,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id + 88882448,
        });

        await expect(() => executeController(operation)).rejects.toThrow(
          WalletNotFoundException,
        );
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0008 - Should not create an owner operation with invalid beneficiary wallet account id', async () => {
        const currency = await createCurrency();
        const { user } = await createUser(currency);
        const transactionType = await createTransactionType({
          tag: 'PIXRECEIVE',
          participants: TransactionTypeParticipants.BENEFICIARY,
        });
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const operation = {
          beneficiary: {
            operationId: faker.datatype.uuid(),
            walletId: faker.datatype.uuid(),
            currencyTag: currency.tag,
            rawValue: 1000,
            fee: 0,
            description: 'Send PIX',
          },
          transactionTag: transactionType.tag,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id + 88882448,
        });

        await expect(() => executeController(operation)).rejects.toThrow(
          WalletNotFoundException,
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
