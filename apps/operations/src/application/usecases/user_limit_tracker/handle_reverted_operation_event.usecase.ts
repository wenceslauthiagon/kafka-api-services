import { Logger } from 'winston';
import {
  Operation,
  OperationAnalysisTag,
  OperationRepository,
  UserLimitRepository,
  UserLimitTracker,
  UserLimitTrackerRepository,
} from '@zro/operations/domain';
import {
  UserLimitNotFoundException,
  UserLimitTrackerNotFoundException,
} from '@zro/operations/application';
import { MissingDataException, getMoment } from '@zro/common';

export class HandleRevertedOperationEventUseCase {
  /**
   * Default constructor.
   * @param logger Logger service.
   * @param userLimitTrackerRepository User Limit Tracker repository.
   * @param userLimitRepository UserLimit repository.
   * @param operationRepository OperationRepository.
   */
  constructor(
    private logger: Logger,
    private readonly userLimitTrackerRepository: UserLimitTrackerRepository,
    private readonly userLimitRepository: UserLimitRepository,
    private readonly operationRepository: OperationRepository,
  ) {
    this.logger = logger.child({
      context: HandleRevertedOperationEventUseCase.name,
    });
  }

  /**
   * Update User Limit Tracker by reverted operation.
   *
   * @param ownerOperation Owner operation.
   * @param beneficiaryOperation Owner operation.
   */
  async execute(
    ownerOperation: Operation,
    beneficiaryOperation: Operation,
  ): Promise<void> {
    // Data input check
    if (!ownerOperation && !beneficiaryOperation) {
      throw new MissingDataException(['At least one operation']);
    }

    if (ownerOperation) {
      // Check if operation is related to a user limit tracker.
      if (!ownerOperation.userLimitTracker) {
        return;
      }

      // Idempotence: revert user limit tracker if there are analysis tags.
      if (!ownerOperation.analysisTags?.length) {
        return;
      }

      const userLimitTrackerOwner =
        await this.getUserLimitTrackerWithUserLimit(ownerOperation);

      if (userLimitTrackerOwner) {
        await this.updateOperationAndUserLimitTracker(
          ownerOperation,
          userLimitTrackerOwner,
        );
      }
    }

    if (beneficiaryOperation) {
      // Check if operation is related to a user limit tracker.
      if (!beneficiaryOperation.userLimitTracker) {
        return;
      }

      // Idempotence: revert user limit tracker if there are analysis tags.
      if (!beneficiaryOperation.analysisTags.length) {
        return;
      }

      // Check if operation transaction type has a user limit tracker.
      const userLimitTrackerBeneficiary =
        await this.getUserLimitTrackerWithUserLimit(beneficiaryOperation);

      if (userLimitTrackerBeneficiary) {
        await this.updateOperationAndUserLimitTracker(
          beneficiaryOperation,
          userLimitTrackerBeneficiary,
        );
      }
    }
  }

  private async getUserLimitTrackerWithUserLimit(
    operation: Operation,
  ): Promise<UserLimitTracker> {
    const userLimitTracker = await this.userLimitTrackerRepository.getById(
      operation.userLimitTracker.id,
    );

    if (!userLimitTracker) {
      throw new UserLimitTrackerNotFoundException(operation.userLimitTracker);
    }

    const userLimit = await this.userLimitRepository.getById(
      userLimitTracker.userLimit.id,
    );

    if (!userLimit) {
      throw new UserLimitNotFoundException(userLimitTracker.userLimit);
    }

    userLimitTracker.userLimit = userLimit;

    return userLimitTracker;
  }

  private async updateOperationAndUserLimitTracker(
    operation: Operation,
    userLimitTracker: UserLimitTracker,
  ): Promise<void> {
    // Revert INTERVAL period user limit tracker.
    if (
      this.analysisTagExistsInOperation(
        OperationAnalysisTag.DAILY_INTERVAL_LIMIT_INCLUDED,
        operation,
      ) ||
      this.analysisTagExistsInOperation(
        OperationAnalysisTag.MONTHLY_INTERVAL_LIMIT_INCLUDED,
        operation,
      ) ||
      this.analysisTagExistsInOperation(
        OperationAnalysisTag.ANNUAL_INTERVAL_LIMIT_INCLUDED,
        operation,
      )
    ) {
      userLimitTracker = await this.revertUserLimitTrackerByIntervalPeriod(
        userLimitTracker,
        operation,
      );
    }

    // Revert DATE period user limit tracker.
    if (
      this.analysisTagExistsInOperation(
        OperationAnalysisTag.DATE_LIMIT_INCLUDED,
        operation,
      )
    ) {
      userLimitTracker = await this.revertUserLimitTrackerByDatePeriod(
        userLimitTracker,
        operation,
      );
    }

    // Only decrement nightly variable if it was incremented in the same night.
    if (
      userLimitTracker.userLimit.isInNighttimeInterval(
        getMoment(operation.createdAt),
      ) &&
      userLimitTracker.userLimit.isInNighttimeInterval(getMoment())
    ) {
      userLimitTracker.usedNightlyLimit -= operation.value;

      if (userLimitTracker.usedNightlyLimit < 0)
        userLimitTracker.usedNightlyLimit = 0;
    }

    // Update operation.
    operation.analysisTags = [];

    // Update Operation analysis tags only.
    await this.operationRepository.updateAnalysisTags({
      id: operation.id,
      analysisTags: operation.analysisTags,
    });

    this.logger.debug('Operation analysis tags updated.', {
      operation: {
        id: operation.id,
        analysisTags: operation.analysisTags,
      },
    });

    // Update User Limit Tracker.
    await this.userLimitTrackerRepository.update(userLimitTracker);
    this.logger.debug('User limit tracker updated.', {
      userLimitTracker,
    });
  }

  private analysisTagExistsInOperation(
    tag: OperationAnalysisTag,
    operation: Operation,
  ): boolean {
    const index = operation.analysisTags.indexOf(tag);

    return index >= 0;
  }

  private async revertUserLimitTrackerByIntervalPeriod(
    userLimitTracker: UserLimitTracker,
    operation: Operation,
  ): Promise<UserLimitTracker> {
    // If day interval has passed, decrement usedDailyLimit.
    if (
      this.analysisTagExistsInOperation(
        OperationAnalysisTag.DAILY_INTERVAL_LIMIT_INCLUDED,
        operation,
      )
    ) {
      userLimitTracker.usedDailyLimit -= operation.value;

      if (userLimitTracker.usedDailyLimit < 0)
        userLimitTracker.usedDailyLimit = 0;
    }

    // If month interval interval has passed, decrement usedMonthlyLimit.
    if (
      this.analysisTagExistsInOperation(
        OperationAnalysisTag.MONTHLY_INTERVAL_LIMIT_INCLUDED,
        operation,
      )
    ) {
      userLimitTracker.usedMonthlyLimit -= operation.value;

      if (userLimitTracker.usedMonthlyLimit < 0)
        userLimitTracker.usedMonthlyLimit = 0;
    }

    // If year interval has passed, restart usedAnnualLimit.
    if (
      this.analysisTagExistsInOperation(
        OperationAnalysisTag.ANNUAL_INTERVAL_LIMIT_INCLUDED,
        operation,
      )
    ) {
      userLimitTracker.usedAnnualLimit -= operation.value;

      if (userLimitTracker.usedAnnualLimit < 0)
        userLimitTracker.usedAnnualLimit = 0;
    }

    return userLimitTracker;
  }

  private async revertUserLimitTrackerByDatePeriod(
    userLimitTracker: UserLimitTracker,
    operation: Operation,
  ): Promise<UserLimitTracker> {
    const createdAt = getMoment(operation.createdAt);

    const startOfDay = getMoment().startOf('day');
    const startOfMonth = getMoment().startOf('month');
    const startOfYear = getMoment().startOf('year');

    // Only decrement daily variable if it was incremented in the same day.
    if (
      userLimitTracker.usedDailyLimit > 0 &&
      createdAt.isSameOrAfter(startOfDay)
    ) {
      userLimitTracker.usedDailyLimit -= operation.value;

      if (userLimitTracker.usedDailyLimit < 0)
        userLimitTracker.usedDailyLimit = 0;
    }

    // Only decrement monthly variable if it was incremented in the same month.
    if (
      userLimitTracker.usedMonthlyLimit > 0 &&
      createdAt.isSameOrAfter(startOfMonth)
    ) {
      userLimitTracker.usedMonthlyLimit -= operation.value;

      if (userLimitTracker.usedMonthlyLimit < 0)
        userLimitTracker.usedMonthlyLimit = 0;
    }

    // Only decrement annual variable if it was incremented in the same year.
    if (
      userLimitTracker.usedAnnualLimit > 0 &&
      createdAt.isSameOrAfter(startOfYear)
    ) {
      userLimitTracker.usedAnnualLimit -= operation.value;

      if (userLimitTracker.usedAnnualLimit < 0)
        userLimitTracker.usedAnnualLimit = 0;
    }

    return userLimitTracker;
  }
}
