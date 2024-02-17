import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, getMoment } from '@zro/common';
import {
  LimitTypePeriodStart,
  OperationAnalysisTag,
  OperationEntity,
  OperationRepository,
  UserLimitTrackerRepository,
  UserLimitTrackerEntity,
  OperationState,
} from '@zro/operations/domain';
import {
  SyncUpdateUserLimitTrackerByIntervalUseCase as UseCase,
  UserLimitTrackerNotFoundException,
} from '@zro/operations/application';
import {
  OperationFactory,
  UserLimitTrackerFactory,
} from '@zro/test/operations/config';

describe('SyncUpdateUserLimitTrackerByIntervalUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const userLimitTrackerRepository: UserLimitTrackerRepository =
      createMock<UserLimitTrackerRepository>();
    const mockUpdateUserLimitTrackerRepository: jest.Mock = On(
      userLimitTrackerRepository,
    ).get(method((mock) => mock.update));
    const mockGetUserLimitTrackerById: jest.Mock = On(
      userLimitTrackerRepository,
    ).get(method((mock) => mock.getById));

    const operationRepository: OperationRepository =
      createMock<OperationRepository>();
    const mockGetAllByPaginationAndAnalysisTag: jest.Mock = On(
      operationRepository,
    ).get(method((mock) => mock.getAllByPaginationAndAnalysisTagBeforeDate));
    const mockUpdateOperationRepository: jest.Mock = On(
      operationRepository,
    ).get(method((mock) => mock.update));

    return {
      userLimitTrackerRepository,
      operationRepository,
      mockUpdateUserLimitTrackerRepository,
      mockGetAllByPaginationAndAnalysisTag,
      mockUpdateOperationRepository,
      mockGetUserLimitTrackerById,
    };
  };

  const makeSut = () => {
    const {
      userLimitTrackerRepository,
      operationRepository,
      mockUpdateUserLimitTrackerRepository,
      mockGetAllByPaginationAndAnalysisTag,
      mockUpdateOperationRepository,
      mockGetUserLimitTrackerById,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      userLimitTrackerRepository,
      operationRepository,
    );
    return {
      sut,
      mockUpdateUserLimitTrackerRepository,
      mockGetAllByPaginationAndAnalysisTag,
      mockUpdateOperationRepository,
      mockGetUserLimitTrackerById,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if no operation is found.', async () => {
      const {
        sut,
        mockUpdateUserLimitTrackerRepository,
        mockGetAllByPaginationAndAnalysisTag,
        mockUpdateOperationRepository,
        mockGetUserLimitTrackerById,
      } = makeSut();

      mockGetAllByPaginationAndAnalysisTag.mockResolvedValue({
        data: null,
        page: 1,
        pageSize: 100,
        pageTotal: 0,
        total: 0,
      });

      await sut.execute();

      expect(mockUpdateUserLimitTrackerRepository).toHaveBeenCalledTimes(0);
      expect(mockGetAllByPaginationAndAnalysisTag).toHaveBeenCalledTimes(3);
      expect(mockUpdateOperationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserLimitTrackerById).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw UserLimitTrackerNotFoundException if operation has no user limit tracker.', async () => {
      const { sut, mockGetAllByPaginationAndAnalysisTag } = makeSut();

      const userLimitTracker =
        await UserLimitTrackerFactory.create<UserLimitTrackerEntity>(
          UserLimitTrackerEntity.name,
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          state: OperationState.ACCEPTED,
          analysisTags: [
            OperationAnalysisTag.DAILY_INTERVAL_LIMIT_INCLUDED,
            OperationAnalysisTag.MONTHLY_INTERVAL_LIMIT_INCLUDED,
            OperationAnalysisTag.ANNUAL_INTERVAL_LIMIT_INCLUDED,
          ],
          userLimitTracker,
          createdAt: getMoment().subtract(2, 'year').toDate(),
        },
      );

      mockGetAllByPaginationAndAnalysisTag.mockResolvedValueOnce({
        data: [{ ...operation, beneficiary: null }],
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 1,
      });
      mockGetAllByPaginationAndAnalysisTag.mockResolvedValueOnce({
        data: [{ ...operation, owner: null }],
        page: 1,
        pageSize: 1,
        pageTotal: 2,
        total: 2,
      });
      mockGetAllByPaginationAndAnalysisTag.mockResolvedValueOnce({
        data: [],
        page: 2,
        pageSize: 1,
        pageTotal: 2,
        total: 2,
      });
      mockGetAllByPaginationAndAnalysisTag.mockResolvedValueOnce({
        data: [{ ...operation, userLimitTracker: null }],
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 1,
      });

      const testScript = () => sut.execute();
      await expect(testScript).rejects.toThrow(
        UserLimitTrackerNotFoundException,
      );
    });

    it('TC0003 - Should not update if no user limit tracker is found by operation user limit tracker id.', async () => {
      const {
        sut,
        mockUpdateUserLimitTrackerRepository,
        mockGetAllByPaginationAndAnalysisTag,
        mockUpdateOperationRepository,
        mockGetUserLimitTrackerById,
      } = makeSut();

      const userLimitTracker =
        await UserLimitTrackerFactory.create<UserLimitTrackerEntity>(
          UserLimitTrackerEntity.name,
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          state: OperationState.ACCEPTED,
          analysisTags: [
            OperationAnalysisTag.DAILY_INTERVAL_LIMIT_INCLUDED,
            OperationAnalysisTag.MONTHLY_INTERVAL_LIMIT_INCLUDED,
            OperationAnalysisTag.ANNUAL_INTERVAL_LIMIT_INCLUDED,
          ],
          userLimitTracker,
          createdAt: getMoment().subtract(2, 'year').toDate(),
        },
      );

      mockGetAllByPaginationAndAnalysisTag.mockResolvedValue({
        data: [operation],
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 1,
      });
      mockGetUserLimitTrackerById.mockResolvedValue(null);

      await sut.execute();

      expect(mockUpdateUserLimitTrackerRepository).toHaveBeenCalledTimes(0);
      expect(mockGetAllByPaginationAndAnalysisTag).toHaveBeenCalledTimes(3);
      expect(mockUpdateOperationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserLimitTrackerById).toHaveBeenCalledTimes(3);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should update user limit tracker and operation successfully.', async () => {
      const {
        sut,
        mockUpdateUserLimitTrackerRepository,
        mockGetAllByPaginationAndAnalysisTag,
        mockUpdateOperationRepository,
        mockGetUserLimitTrackerById,
      } = makeSut();

      const userLimitTracker =
        await UserLimitTrackerFactory.create<UserLimitTrackerEntity>(
          UserLimitTrackerEntity.name,
          {
            usedDailyLimit: 1000,
            usedMonthlyLimit: 1000,
            usedAnnualLimit: 1000,
            periodStart: LimitTypePeriodStart.INTERVAL,
            usedNightlyLimit: 0,
          },
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          value: 100,
          state: OperationState.ACCEPTED,
          analysisTags: [
            OperationAnalysisTag.DAILY_INTERVAL_LIMIT_INCLUDED,
            OperationAnalysisTag.MONTHLY_INTERVAL_LIMIT_INCLUDED,
            OperationAnalysisTag.ANNUAL_INTERVAL_LIMIT_INCLUDED,
          ],
          userLimitTracker,
          createdAt: getMoment().subtract(2, 'year').toDate(),
        },
      );

      mockGetAllByPaginationAndAnalysisTag.mockResolvedValue({
        data: [operation],
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 1,
      });
      mockGetUserLimitTrackerById.mockResolvedValue(userLimitTracker);

      const previousUsedDailyLimit = userLimitTracker.usedDailyLimit;
      const previousUsedMonthlyLimit = userLimitTracker.usedMonthlyLimit;
      const previousUsedAnnualLimit = userLimitTracker.usedAnnualLimit;
      const previousUsedNightlyLimit = userLimitTracker.usedNightlyLimit;

      await sut.execute();

      expect(mockUpdateUserLimitTrackerRepository).toHaveBeenCalledTimes(3);
      expect(mockGetAllByPaginationAndAnalysisTag).toHaveBeenCalledTimes(3);
      expect(mockUpdateOperationRepository).toHaveBeenCalledTimes(3);
      expect(userLimitTracker.usedDailyLimit).toBe(
        previousUsedDailyLimit - operation.value,
      );
      expect(userLimitTracker.usedMonthlyLimit).toBe(
        previousUsedMonthlyLimit - operation.value,
      );
      expect(userLimitTracker.usedAnnualLimit).toBe(
        previousUsedAnnualLimit - operation.value,
      );
      expect(userLimitTracker.usedNightlyLimit).toBe(previousUsedNightlyLimit);
      expect(operation.analysisTags).toStrictEqual([]);
      expect(mockGetUserLimitTrackerById).toHaveBeenCalledTimes(3);
    });

    it('TC0005 - Should update user limit tracker and operation without negative values.', async () => {
      const {
        sut,
        mockUpdateUserLimitTrackerRepository,
        mockGetAllByPaginationAndAnalysisTag,
        mockUpdateOperationRepository,
        mockGetUserLimitTrackerById,
      } = makeSut();

      const userLimitTracker =
        await UserLimitTrackerFactory.create<UserLimitTrackerEntity>(
          UserLimitTrackerEntity.name,
          {
            usedDailyLimit: 100,
            usedMonthlyLimit: 100,
            usedAnnualLimit: 100,
            periodStart: LimitTypePeriodStart.INTERVAL,
            usedNightlyLimit: 0,
          },
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          value: 1000,
          state: OperationState.ACCEPTED,
          analysisTags: [
            OperationAnalysisTag.DAILY_INTERVAL_LIMIT_INCLUDED,
            OperationAnalysisTag.MONTHLY_INTERVAL_LIMIT_INCLUDED,
            OperationAnalysisTag.ANNUAL_INTERVAL_LIMIT_INCLUDED,
          ],
          userLimitTracker,
          createdAt: getMoment().subtract(2, 'year').toDate(),
        },
      );

      mockGetAllByPaginationAndAnalysisTag.mockResolvedValue({
        data: [operation],
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 1,
      });
      mockGetUserLimitTrackerById.mockResolvedValue(userLimitTracker);

      await sut.execute();

      expect(mockUpdateUserLimitTrackerRepository).toHaveBeenCalledTimes(3);
      expect(mockGetAllByPaginationAndAnalysisTag).toHaveBeenCalledTimes(3);
      expect(mockUpdateOperationRepository).toHaveBeenCalledTimes(3);
      expect(userLimitTracker.usedDailyLimit).toBe(0);
      expect(userLimitTracker.usedMonthlyLimit).toBe(0);
      expect(userLimitTracker.usedAnnualLimit).toBe(0);
      expect(operation.analysisTags).toStrictEqual([]);
      expect(mockGetUserLimitTrackerById).toHaveBeenCalledTimes(3);
    });
  });
});
