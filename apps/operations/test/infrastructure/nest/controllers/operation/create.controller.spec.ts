import { createMock } from 'ts-auto-mock';
import { On, method } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Sequelize } from 'sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import {
  DATABASE_PROVIDER,
  RedisService,
  defaultLogger as logger,
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
  CreateOperationMicroserviceController as Controller,
  UserServiceKafka,
  WalletAccountCacheDatabaseRepository,
  WalletDatabaseRepository,
  UserLimitTrackerDatabaseRepository,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import {
  CreateAndAcceptOperationRequest,
  CreateOperationRequest,
  CreateOperationResponse,
  OperationEventEmitterControllerInterface,
  OperationEventType,
  UserLimitEventEmitterControllerInterface,
} from '@zro/operations/interface';
import {
  CurrencyFactory,
  WalletFactory,
  WalletAccountFactory,
  TransactionTypeFactory,
  LimitTypeFactory,
  GlobalLimitFactory,
  UserLimitFactory,
} from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';
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
  ): Promise<CreateOperationResponse> => {
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

      const message: CreateOperationRequest = {
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

        expect(ownerOperation.id).not.toBeNull();
        expect(ownerOperation.rawValue).toBe(operation.owner.rawValue);
        expect(ownerOperation.value).toBe(value);
        expect(ownerOperation.fee).toBe(operation.owner.fee);
        expect(ownerOperation.description).toBe(operation.owner.description);
        expect(ownerOperation.transactionId).toBe(transactionType.id);
        expect(ownerOperation.createdAt).not.toBeNull();
        expect(ownerOperation.state).toBe(OperationState.PENDING);
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(1);
        expect(mockEmitOperationEventEmitter.mock.calls[0][0]).toBe(
          OperationEventType.PENDING,
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

        const createdOwnerOperation = await OperationModel.findOne({
          where: { id: ownerOperation.id },
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

        expect(beneficiaryOperation.id).not.toBeNull();
        expect(beneficiaryOperation.rawValue).toBe(
          operation.beneficiary.rawValue,
        );
        expect(beneficiaryOperation.value).toBe(value);
        expect(beneficiaryOperation.fee).toBe(operation.beneficiary.fee);
        expect(beneficiaryOperation.description).toBe(
          operation.beneficiary.description,
        );
        expect(beneficiaryOperation.transactionId).toBe(transactionType.id);
        expect(beneficiaryOperation.createdAt).not.toBeNull();
        expect(beneficiaryOperation.state).toBe(OperationState.PENDING);
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(1);
        expect(mockEmitOperationEventEmitter.mock.calls[0][0]).toBe(
          OperationEventType.PENDING,
        );
        expect(mockEmitOperationEventEmitter.mock.calls[0][1]).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].beneficiaryOperation,
        ).toBeDefined();
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].beneficiaryOperation
            .beneficiaryId,
        ).toBe(user.id);
        expect(
          mockEmitOperationEventEmitter.mock.calls[0][1].ownerOperation,
        ).toBeNull();

        const createdBeneficiaryOperation = await OperationModel.findOne({
          where: { id: beneficiaryOperation.id },
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
          walletAccount.id,
        );

        const updatedWalletAccount = await WalletAccountModel.findOne({
          where: { id: walletAccount.id },
        });

        expect(updatedWalletAccount).not.toBeNull();
        expect(updatedWalletAccount.balance).toBe(walletAccount.balance);
        expect(updatedWalletAccount.pendingAmount).toBe(
          walletAccount.pendingAmount,
        );
      });

      it(`TC0003 - Should create N owner's operations successfully`, async () => {
        const currency = await createCurrency();
        const { user, wallet, walletAccount } = await createUser(currency);
        const transactionType = await createTransactionType();
        const limitType = await createLimitType(currency, transactionType);
        await createGlobalLimit(limitType);
        await createUserLimit(user, limitType);

        const operation = {
          owner: {
            walletId: wallet.uuid,
            currencyTag: currency.tag,
            rawValue: 1000,
            fee: 0,
            description: 'Send PIX',
          },
          transactionTag: transactionType.tag,
        };

        mockGetUserByUuidService.mockReturnValue(user);

        const times = 10;
        let responses = [];

        for (let i = 0; i < times; i++) {
          const op: any = { ...operation };
          op.owner = { ...operation.owner, operationId: faker.datatype.uuid() };

          const response = executeController(op);

          responses.push(response);
        }

        responses = await Promise.all(responses);

        responses = responses.sort((a, b) => {
          const aDate = new Date(a.owner.createdAt).getTime();
          const bDate = new Date(b.owner.createdAt).getTime();
          return aDate - bDate;
        });

        const value = operation.owner.rawValue + operation.owner.fee;

        for (const response of responses) {
          const { owner: ownerOperation, beneficiary: beneficiaryOperation } =
            response;

          expect(ownerOperation).not.toBeNull();
          expect(beneficiaryOperation).toBeNull();

          expect(ownerOperation.id).not.toBeNull();
          expect(ownerOperation.rawValue).toBe(operation.owner.rawValue);
          expect(ownerOperation.value).toBe(value);
          expect(ownerOperation.fee).toBe(operation.owner.fee);
          expect(ownerOperation.description).toBe(operation.owner.description);
          expect(ownerOperation.transactionId).toBe(transactionType.id);
          expect(ownerOperation.createdAt).not.toBeNull();
          expect(ownerOperation.state).toBe(OperationState.PENDING);

          const createdOwnerOperation = await OperationModel.findOne({
            where: { id: ownerOperation.id },
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
        }
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(times);

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

      it('TC0004 - Should create an owner operation when ownerAllowAvailableRawValue is TRUE and balance is LESS than rawValue + fee successfully', async () => {
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

        expect(ownerOperation.id).not.toBeNull();
        expect(ownerOperation.rawValue).toBe(newRawValue);
        expect(ownerOperation.value).toBe(value);
        expect(ownerOperation.fee).toBe(newFee);
        expect(ownerOperation.description).toBe(operation.owner.description);
        expect(ownerOperation.transactionId).toBe(transactionType.id);
        expect(ownerOperation.createdAt).not.toBeNull();
        expect(ownerOperation.state).toBe(OperationState.PENDING);
        expect(mockEmitOperationEventEmitter).toHaveBeenCalledTimes(1);
        expect(mockEmitOperationEventEmitter.mock.calls[0][0]).toBe(
          OperationEventType.PENDING,
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

        const createdOwnerOperation = await OperationModel.findOne({
          where: { id: ownerOperation.id },
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
          walletAccount.pendingAmount + value,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0005 - Should not create an owner operation with invalid transaction tag', async () => {
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

      it('TC0006 - Should not create an owner operation with invalid onwer wallet account id', async () => {
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

      it('TC0007 - Should not create an owner operation with invalid beneficiary wallet account id', async () => {
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
