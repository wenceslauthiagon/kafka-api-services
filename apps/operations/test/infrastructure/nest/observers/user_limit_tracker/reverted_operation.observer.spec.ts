import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  getMoment,
  defaultLogger as logger,
} from '@zro/common';
import {
  LimitTypePeriodStart,
  OperationAnalysisTag,
  OperationEntity,
  OperationRepository,
  OperationState,
  TransactionTypeEntity,
  UserLimitRepository,
  UserLimitTrackerRepository,
} from '@zro/operations/domain';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import {
  OperationModel,
  RevertedOperationNestObserver as Observer,
  UserLimitDatabaseRepository,
  UserLimitModel,
  UserLimitTrackerDatabaseRepository,
  UserLimitTrackerModel,
  OperationDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  OperationFactory,
  TransactionTypeFactory,
  UserLimitFactory,
  UserLimitTrackerFactory,
} from '@zro/test/operations/config';
import { HandleRevertedOperationEventRequest } from '@zro/operations/interface';

describe('RevertedOperationNestObserver', () => {
  let module: TestingModule;
  let observer: Observer;
  let userLimitTrackerRepository: UserLimitTrackerRepository;
  let userLimitRepository: UserLimitRepository;
  let operationRepository: OperationRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    observer = module.get<Observer>(Observer);

    userLimitTrackerRepository = new UserLimitTrackerDatabaseRepository();
    userLimitRepository = new UserLimitDatabaseRepository();
    operationRepository = new OperationDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should update a user limit tracker for REVERTED operations successfully', async () => {
      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
        );

      const userLimit = await UserLimitFactory.create<UserLimitModel>(
        UserLimitModel.name,
        {
          nighttimeStart: '00:00',
          nighttimeEnd: '23:59',
        },
      );

      const userLimitTracker =
        await UserLimitTrackerFactory.create<UserLimitTrackerModel>(
          UserLimitTrackerModel.name,
          {
            usedDailyLimit: 1000,
            usedMonthlyLimit: 1000,
            usedAnnualLimit: 1000,
            usedNightlyLimit: 1000,
            periodStart: LimitTypePeriodStart.DATE,
            userLimitId: userLimit.id,
          },
        );

      const ownerOperation = await OperationFactory.create<OperationModel>(
        OperationModel.name,
        {
          value: 100,
          userLimitTrackerId: userLimitTracker.id,
          analysisTags: [OperationAnalysisTag.DATE_LIMIT_INCLUDED],
          state: OperationState.REVERTED,
          createdAt: getMoment().toDate(),
          transactionTypeId: transactionType.id,
        },
      );

      const previousUsedDailyLimit = userLimitTracker.usedDailyLimit;
      const previousUsedMonthlyLimit = userLimitTracker.usedMonthlyLimit;
      const previousUsedAnnualLimit = userLimitTracker.usedAnnualLimit;
      const previousUsedNightlyLimit = userLimitTracker.usedNightlyLimit;

      const message: HandleRevertedOperationEventRequest = {
        ownerOperation: {
          id: ownerOperation.id,
          rawValue: ownerOperation.rawValue,
          fee: ownerOperation.fee,
          value: ownerOperation.value,
          description: ownerOperation.description,
          ownerId: ownerOperation.ownerId,
          ownerWalletAccountId: ownerOperation.ownerWalletAccountId,
          transactionId: ownerOperation.transactionTypeId,
          transactionTag: transactionType.tag,
          currencyId: ownerOperation.currencyId,
          state: ownerOperation.state,
          analysisTags: ownerOperation.analysisTags,
          userLimitTrackerId: ownerOperation.userLimitTrackerId,
          createdAt: ownerOperation.createdAt,
        },
      };

      await observer.executeRevertedOperation(
        message,
        userLimitTrackerRepository,
        userLimitRepository,
        operationRepository,
        logger,
      );

      const updatedUserLimitTracker = await UserLimitTrackerModel.findOne({
        where: { id: userLimitTracker.id },
      }).then(UserLimitTrackerDatabaseRepository.toDomain);

      expect(updatedUserLimitTracker.usedDailyLimit).toBe(
        previousUsedDailyLimit - ownerOperation.value,
      );
      expect(updatedUserLimitTracker.usedMonthlyLimit).toBe(
        previousUsedMonthlyLimit - ownerOperation.value,
      );
      expect(updatedUserLimitTracker.usedAnnualLimit).toBe(
        previousUsedAnnualLimit - ownerOperation.value,
      );
      expect(updatedUserLimitTracker.usedNightlyLimit).toBe(
        previousUsedNightlyLimit - ownerOperation.value,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not update when the request is invalid.', async () => {
      const ownerOperation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );

      const message: HandleRevertedOperationEventRequest = {
        ownerOperation: {
          id: 'test',
          rawValue: ownerOperation.rawValue,
          fee: ownerOperation.fee,
          value: ownerOperation.value,
          description: ownerOperation.description,
          ownerId: ownerOperation.owner.id,
          ownerWalletAccountId: ownerOperation.ownerWalletAccount.id,
          transactionId: ownerOperation.transactionType.id,
          transactionTag: ownerOperation.transactionType.tag,
          currencyId: ownerOperation.currency.id,
          state: ownerOperation.state,
        },
      };

      const result = () =>
        observer.executeRevertedOperation(
          message,
          userLimitTrackerRepository,
          userLimitRepository,
          operationRepository,
          logger,
        );

      await expect(result).rejects.toThrow(InvalidDataFormatException);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
