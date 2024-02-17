import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  defaultLogger as logger,
  MissingDataException,
  getMoment,
} from '@zro/common';
import {
  HandleRevertedOperationEventUseCase as UseCase,
  UserLimitNotFoundException,
  UserLimitTrackerNotFoundException,
} from '@zro/operations/application';
import {
  LimitTypePeriodStart,
  OperationAnalysisTag,
  OperationEntity,
  OperationRepository,
  UserLimitEntity,
  UserLimitRepository,
  UserLimitTrackerEntity,
  UserLimitTrackerRepository,
} from '@zro/operations/domain';
import {
  OperationFactory,
  UserLimitFactory,
  UserLimitTrackerFactory,
} from '@zro/test/operations/config';

describe('HandleUpdateUserLimitTrackerEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const userLimitRepository = createMock<UserLimitRepository>();
    const mockGetUserLimit: jest.Mock = On(userLimitRepository).get(
      method((mock) => mock.getById),
    );

    const userLimitTrackerRepository = createMock<UserLimitTrackerRepository>();
    const mockGetUserLimitTracker: jest.Mock = On(
      userLimitTrackerRepository,
    ).get(method((mock) => mock.getById));
    const mockUpdateUserLimitTracker: jest.Mock = On(
      userLimitTrackerRepository,
    ).get(method((mock) => mock.update));

    const operationRepository = createMock<OperationRepository>();
    const mockUpdateOperation: jest.Mock = On(operationRepository).get(
      method((mock) => mock.updateAnalysisTags),
    );

    return {
      userLimitRepository,
      mockGetUserLimit,
      userLimitTrackerRepository,
      mockGetUserLimitTracker,
      mockUpdateUserLimitTracker,
      operationRepository,
      mockUpdateOperation,
    };
  };

  const makeSut = () => {
    const {
      userLimitRepository,
      mockGetUserLimit,
      userLimitTrackerRepository,
      mockGetUserLimitTracker,
      mockUpdateUserLimitTracker,
      operationRepository,
      mockUpdateOperation,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      userLimitTrackerRepository,
      userLimitRepository,
      operationRepository,
    );

    return {
      sut,
      mockGetUserLimit,
      mockGetUserLimitTracker,
      mockUpdateUserLimitTracker,
      mockUpdateOperation,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params.', async () => {
      const {
        sut,
        mockGetUserLimit,
        mockGetUserLimitTracker,
        mockUpdateUserLimitTracker,
        mockUpdateOperation,
      } = makeSut();

      const testScript = () => sut.execute(null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetUserLimit).toHaveBeenCalledTimes(0);
      expect(mockGetUserLimitTracker).toHaveBeenCalledTimes(0);
      expect(mockUpdateUserLimitTracker).toHaveBeenCalledTimes(0);
      expect(mockUpdateOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should return if operation is not associated to a user limit tacker.', async () => {
      const {
        sut,
        mockGetUserLimit,
        mockGetUserLimitTracker,
        mockUpdateUserLimitTracker,
        mockUpdateOperation,
      } = makeSut();

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          userLimitTracker: null,
        },
      );

      const testScripts = [
        await sut.execute(null, operation),
        await sut.execute(operation, null),
      ];

      for (const testScript of testScripts) {
        expect(testScript).toBeUndefined();
        expect(mockGetUserLimit).toHaveBeenCalledTimes(0);
        expect(mockGetUserLimitTracker).toHaveBeenCalledTimes(0);
        expect(mockUpdateUserLimitTracker).toHaveBeenCalledTimes(0);
        expect(mockUpdateOperation).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0003 - Should return if operation analysis tags is empty.', async () => {
      const {
        sut,
        mockGetUserLimit,
        mockGetUserLimitTracker,
        mockUpdateUserLimitTracker,
        mockUpdateOperation,
      } = makeSut();

      const userLimitTracker =
        await UserLimitTrackerFactory.create<UserLimitTrackerEntity>(
          UserLimitTrackerEntity.name,
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          userLimitTracker,
          analysisTags: [],
        },
      );

      const testScripts = [
        await sut.execute(null, operation),
        await sut.execute(operation, null),
      ];

      for (const testScript of testScripts) {
        expect(testScript).toBeUndefined();
        expect(mockGetUserLimit).toHaveBeenCalledTimes(0);
        expect(mockGetUserLimitTracker).toHaveBeenCalledTimes(0);
        expect(mockUpdateUserLimitTracker).toHaveBeenCalledTimes(0);
        expect(mockUpdateOperation).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0004 - Should throw UserLimitTrackerNotFoundException if user limit tracker is not found.', async () => {
      const {
        sut,
        mockGetUserLimit,
        mockGetUserLimitTracker,
        mockUpdateUserLimitTracker,
        mockUpdateOperation,
      } = makeSut();

      const userLimitTracker =
        await UserLimitTrackerFactory.create<UserLimitTrackerEntity>(
          UserLimitTrackerEntity.name,
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          userLimitTracker,
          analysisTags: [OperationAnalysisTag.DATE_LIMIT_INCLUDED],
        },
      );

      mockGetUserLimitTracker.mockResolvedValue(null);

      const testScript = () => sut.execute(operation, null);

      await expect(testScript).rejects.toThrow(
        UserLimitTrackerNotFoundException,
      );
      expect(mockGetUserLimit).toHaveBeenCalledTimes(0);
      expect(mockGetUserLimitTracker).toHaveBeenCalledTimes(1);
      expect(mockUpdateUserLimitTracker).toHaveBeenCalledTimes(0);
      expect(mockUpdateOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should throw UserLimitNotFoundException if user limit is not found.', async () => {
      const {
        sut,
        mockGetUserLimit,
        mockGetUserLimitTracker,
        mockUpdateUserLimitTracker,
        mockUpdateOperation,
      } = makeSut();

      const userLimitTracker =
        await UserLimitTrackerFactory.create<UserLimitTrackerEntity>(
          UserLimitTrackerEntity.name,
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          userLimitTracker,
          analysisTags: [OperationAnalysisTag.DATE_LIMIT_INCLUDED],
        },
      );

      mockGetUserLimitTracker.mockResolvedValue(userLimitTracker);
      mockGetUserLimit.mockResolvedValue(null);

      const testScript = () => sut.execute(operation, null);

      await expect(testScript).rejects.toThrow(UserLimitNotFoundException);
      expect(mockGetUserLimit).toHaveBeenCalledTimes(1);
      expect(mockGetUserLimitTracker).toHaveBeenCalledTimes(1);
      expect(mockUpdateUserLimitTracker).toHaveBeenCalledTimes(0);
      expect(mockUpdateOperation).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should update operation and userLimitTracker for DATE period start successfully.', async () => {
      const {
        sut,
        mockGetUserLimit,
        mockGetUserLimitTracker,
        mockUpdateUserLimitTracker,
        mockUpdateOperation,
      } = makeSut();

      const userLimit = await UserLimitFactory.create<UserLimitEntity>(
        UserLimitEntity.name,
        {
          nighttimeStart: '00:00',
          nighttimeEnd: '23:59',
        },
      );

      const userLimitTracker =
        await UserLimitTrackerFactory.create<UserLimitTrackerEntity>(
          UserLimitTrackerEntity.name,
          {
            periodStart: LimitTypePeriodStart.DATE,
            userLimit,
          },
        );

      const dailyBeforeUpdate = userLimitTracker.usedDailyLimit;
      const monthlyBeforeUpdate = userLimitTracker.usedMonthlyLimit;
      const annualBeforeUpdate = userLimitTracker.usedAnnualLimit;
      const nightlyBeforeUpdate = userLimitTracker.usedNightlyLimit;

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          userLimitTracker,
          analysisTags: [OperationAnalysisTag.DATE_LIMIT_INCLUDED],
          createdAt: getMoment().toDate(),
        },
      );

      mockGetUserLimitTracker.mockResolvedValue(userLimitTracker);
      mockGetUserLimit.mockResolvedValue(userLimit);

      const testScript = await sut.execute(operation, null);

      dailyBeforeUpdate - operation.value < 0
        ? expect(userLimitTracker.usedDailyLimit).toBe(0)
        : expect(userLimitTracker.usedDailyLimit).toBe(
            dailyBeforeUpdate - operation.value,
          );
      monthlyBeforeUpdate - operation.value < 0
        ? expect(userLimitTracker.usedMonthlyLimit).toBe(0)
        : expect(userLimitTracker.usedMonthlyLimit).toBe(
            monthlyBeforeUpdate - operation.value,
          );
      annualBeforeUpdate - operation.value < 0
        ? expect(userLimitTracker.usedAnnualLimit).toBe(0)
        : expect(userLimitTracker.usedAnnualLimit).toBe(
            annualBeforeUpdate - operation.value,
          );
      nightlyBeforeUpdate - operation.value < 0
        ? expect(userLimitTracker.usedNightlyLimit).toBe(0)
        : expect(userLimitTracker.usedNightlyLimit).toBe(
            nightlyBeforeUpdate - operation.value,
          );

      expect(testScript).toBeUndefined();
      expect(mockGetUserLimit).toHaveBeenCalledTimes(1);
      expect(mockGetUserLimitTracker).toHaveBeenCalledTimes(1);
      expect(mockUpdateUserLimitTracker).toHaveBeenCalledTimes(1);
      expect(mockUpdateOperation).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should update operation and userLimitTracker for INTERVAL period start successfully.', async () => {
      const {
        sut,
        mockGetUserLimit,
        mockGetUserLimitTracker,
        mockUpdateUserLimitTracker,
        mockUpdateOperation,
      } = makeSut();

      const userLimit = await UserLimitFactory.create<UserLimitEntity>(
        UserLimitEntity.name,
        {
          nighttimeStart: '00:00',
          nighttimeEnd: '23:59',
        },
      );

      const userLimitTracker =
        await UserLimitTrackerFactory.create<UserLimitTrackerEntity>(
          UserLimitTrackerEntity.name,
          {
            periodStart: LimitTypePeriodStart.INTERVAL,
            userLimit,
          },
        );

      const dailyBeforeUpdate = userLimitTracker.usedDailyLimit;
      const monthlyBeforeUpdate = userLimitTracker.usedMonthlyLimit;
      const annualBeforeUpdate = userLimitTracker.usedAnnualLimit;
      const nightlyBeforeUpdate = userLimitTracker.usedNightlyLimit;

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          userLimitTracker,
          analysisTags: [
            OperationAnalysisTag.DAILY_INTERVAL_LIMIT_INCLUDED,
            OperationAnalysisTag.MONTHLY_INTERVAL_LIMIT_INCLUDED,
            OperationAnalysisTag.ANNUAL_INTERVAL_LIMIT_INCLUDED,
          ],
          createdAt: getMoment().toDate(),
        },
      );

      mockGetUserLimitTracker.mockResolvedValue(userLimitTracker);
      mockGetUserLimit.mockResolvedValue(userLimit);

      const testScript = await sut.execute(null, operation);

      dailyBeforeUpdate - operation.value < 0
        ? expect(userLimitTracker.usedDailyLimit).toBe(0)
        : expect(userLimitTracker.usedDailyLimit).toBe(
            dailyBeforeUpdate - operation.value,
          );
      monthlyBeforeUpdate - operation.value < 0
        ? expect(userLimitTracker.usedMonthlyLimit).toBe(0)
        : expect(userLimitTracker.usedMonthlyLimit).toBe(
            monthlyBeforeUpdate - operation.value,
          );
      annualBeforeUpdate - operation.value < 0
        ? expect(userLimitTracker.usedAnnualLimit).toBe(0)
        : expect(userLimitTracker.usedAnnualLimit).toBe(
            annualBeforeUpdate - operation.value,
          );
      nightlyBeforeUpdate - operation.value < 0
        ? expect(userLimitTracker.usedNightlyLimit).toBe(0)
        : expect(userLimitTracker.usedNightlyLimit).toBe(
            nightlyBeforeUpdate - operation.value,
          );

      expect(testScript).toBeUndefined();
      expect(mockGetUserLimit).toHaveBeenCalledTimes(1);
      expect(mockGetUserLimitTracker).toHaveBeenCalledTimes(1);
      expect(mockUpdateUserLimitTracker).toHaveBeenCalledTimes(1);
      expect(mockUpdateOperation).toHaveBeenCalledTimes(1);
    });
  });
});
