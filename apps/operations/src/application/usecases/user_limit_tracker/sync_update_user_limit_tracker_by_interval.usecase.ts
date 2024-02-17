import {
  Operation,
  OperationAnalysisTag,
  OperationRepository,
  OperationRequestSort,
  UserLimitTrackerRepository,
} from '@zro/operations/domain';
import { Logger } from 'winston';
import { PaginationEntity, PaginationOrder, getMoment } from '@zro/common';
import { UserLimitTrackerNotFoundException } from '@zro/operations/application';

type OperationAnalysisTagRule = {
  tag: OperationAnalysisTag;
  lastDate: Date;
};

export class SyncUpdateUserLimitTrackerByIntervalUseCase {
  private readonly PAGE_SIZE = 100;
  private readonly OPERATION_ANALYSIS_TAGS_RULES: OperationAnalysisTagRule[];
  private readonly CURRENT_PAGE = 1;

  /**
   * Default constructor.
   * @param logger Logger service.
   * @param userLimitTrackerRepository User Limit Tracker repository.
   * @param operationRepository OperationRepository.
   * @param userLimitRepository UserLimit repository.
   */
  constructor(
    private logger: Logger,
    private readonly userLimitTrackerRepository: UserLimitTrackerRepository,
    private readonly operationRepository: OperationRepository,
  ) {
    this.logger = logger.child({
      context: SyncUpdateUserLimitTrackerByIntervalUseCase.name,
    });

    this.OPERATION_ANALYSIS_TAGS_RULES = [
      {
        tag: OperationAnalysisTag.DAILY_INTERVAL_LIMIT_INCLUDED,
        lastDate: getMoment().subtract(1, 'day').toDate(),
      },
      {
        tag: OperationAnalysisTag.MONTHLY_INTERVAL_LIMIT_INCLUDED,
        lastDate: getMoment().subtract(1, 'month').toDate(),
      },
      {
        tag: OperationAnalysisTag.ANNUAL_INTERVAL_LIMIT_INCLUDED,
        lastDate: getMoment().subtract(1, 'year').toDate(),
      },
    ];
  }

  /**
   * Update user limit trackers and operations that are no longer valid for the operation analysis tag rules,
   * which are associated to INTERVAL limit type period start.
   */
  async execute(): Promise<void> {
    // Execute for each tag rule
    for (const rule of this.OPERATION_ANALYSIS_TAGS_RULES) {
      //Start execution from page one.
      const pagination = new PaginationEntity({
        page: this.CURRENT_PAGE,
        pageSize: this.PAGE_SIZE,
        sort: OperationRequestSort.CREATED_AT,
        order: PaginationOrder.ASC,
      });

      // While there are more pages to query, go on.
      let goOn = true;

      while (goOn) {
        // Get all operations that have user limit tracker validation tag included but should be excluded.
        const operationsPaginated =
          await this.operationRepository.getAllByPaginationAndAnalysisTagBeforeDate(
            pagination,
            rule.tag,
            rule.lastDate,
          );

        this.logger.debug('Operations found.', {
          operations: operationsPaginated?.total,
        });

        // If no operation is found, go to next tag rule.
        if (!operationsPaginated?.data?.length) {
          goOn = false;
          continue;
        }

        for (let operation of operationsPaginated.data) {
          // Check if user limit tracker exists.
          if (!operation.userLimitTracker?.id) {
            this.logger.error('Operation has no user limit tracker.', {
              operation,
            });

            throw new UserLimitTrackerNotFoundException();
          }

          const userLimitTracker =
            await this.userLimitTrackerRepository.getById(
              operation.userLimitTracker.id,
            );

          this.logger.debug('Found user limit tracker.', {
            userLimitTracker: { id: userLimitTracker?.id },
          });

          // If no userLimitTracker is found, continue.
          if (!userLimitTracker) {
            this.logger.error(
              'User limit tracker not found for this operation.',
              { operation },
            );
            continue;
          }

          // Update operation and user limit tracker.
          if (rule.tag === OperationAnalysisTag.DAILY_INTERVAL_LIMIT_INCLUDED) {
            userLimitTracker.usedDailyLimit -= operation.value;

            if (userLimitTracker.usedDailyLimit < 0)
              userLimitTracker.usedDailyLimit = 0;

            operation = await this.removeAnalysisTagFromOperation(
              OperationAnalysisTag.DAILY_INTERVAL_LIMIT_INCLUDED,
              operation,
            );
          } else if (
            rule.tag === OperationAnalysisTag.MONTHLY_INTERVAL_LIMIT_INCLUDED
          ) {
            userLimitTracker.usedMonthlyLimit -= operation.value;

            if (userLimitTracker.usedMonthlyLimit < 0)
              userLimitTracker.usedMonthlyLimit = 0;

            operation = await this.removeAnalysisTagFromOperation(
              OperationAnalysisTag.MONTHLY_INTERVAL_LIMIT_INCLUDED,
              operation,
            );
          } else if (
            rule.tag === OperationAnalysisTag.ANNUAL_INTERVAL_LIMIT_INCLUDED
          ) {
            userLimitTracker.usedAnnualLimit -= operation.value;

            if (userLimitTracker.usedAnnualLimit < 0)
              userLimitTracker.usedAnnualLimit = 0;

            operation = await this.removeAnalysisTagFromOperation(
              OperationAnalysisTag.ANNUAL_INTERVAL_LIMIT_INCLUDED,
              operation,
            );
          }

          // Update user limit tracker.
          await this.userLimitTrackerRepository.update(userLimitTracker);

          this.logger.debug('User limit tracker updated.', {
            userLimitTracker: { id: userLimitTracker.id },
          });

          // Update operation.
          await this.operationRepository.update(operation);

          this.logger.debug('Operation updated.', {
            operation: { id: operation.id },
          });
        }

        operationsPaginated.page < operationsPaginated.pageTotal
          ? (pagination.page += 1)
          : (goOn = false);
      }
    }
  }

  private async removeAnalysisTagFromOperation(
    tag: OperationAnalysisTag,
    operation: Operation,
  ): Promise<Operation> {
    const index = operation.analysisTags.indexOf(tag);

    if (index >= 0) {
      operation.analysisTags.splice(index, 1);
    }

    return operation;
  }
}
