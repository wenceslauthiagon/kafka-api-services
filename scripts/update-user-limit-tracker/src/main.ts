import { Op } from 'sequelize';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { INestApplication, Module } from '@nestjs/common';
import {
  ConsoleLoggerModule,
  DatabaseModule,
  LoggerModule,
  LOGGER_SERVICE,
  shutdown,
  Pagination,
  PaginationEntity,
  PaginationOrder,
  TPaginationResponse,
  paginationToDomain,
  paginationWhere,
  validateHourTimeFormat,
  getMoment,
} from '@zro/common';
import {
  LimitTypeCheck,
  LimitTypePeriodStart,
  Operation,
  OperationAnalysisTag,
  OperationState,
  OperationRequestSort,
  TransactionType,
  UserLimit,
  UserLimitTracker,
  Currency,
  UserLimitTrackerEntity,
  TGetOperationsFilter,
  UserLimitEntity,
  LimitType,
  GlobalLimit,
} from '@zro/operations/domain';
import { User } from '@zro/users/domain';
import {
  CurrencyModel,
  TransactionTypeModel,
  LimitTypeModel,
  OperationModel,
  UserLimitModel,
  UserLimitTrackerModel,
  TransactionTypeDatabaseRepository,
  OperationDatabaseRepository,
  UserLimitDatabaseRepository,
  UserLimitTrackerDatabaseRepository,
  LimitTypeDatabaseRepository,
  GlobalLimitModel,
  GlobalLimitDatabaseRepository,
} from '@zro/operations/infrastructure';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.update-user-limit-tracker.env'] }),
    LoggerModule,
    DatabaseModule.forFeature([
      TransactionTypeModel,
      LimitTypeModel,
      OperationModel,
      UserLimitModel,
      UserLimitTrackerModel,
      CurrencyModel,
    ]),
  ],
})
class ScriptModule {}

type TUserLimit = UserLimit & { operation: Operation };

const PAGE_SIZE = 100;
const FIRST_PAGE = 1;
const TIME_FORMAT = 'HH:mm';

let app: INestApplication = null;
declare const _BUILD_INFO_: any;

/**
 * This script will update the table users_limits_tracker, incrementing its constants with all valid past operations values.
 */
async function bootstrap() {
  app = await NestFactory.create(ScriptModule, {
    logger: new ConsoleLoggerModule(),
  });

  const logger: Logger = app.get(LOGGER_SERVICE).child({ loggerId: uuidV4() });

  // Log build info.
  logger.info('Build info.', { info: _BUILD_INFO_ });

  logger.info('Starting script...');

  // Execute script.
  await execute(logger);

  logger.info('Script finished.');
  await shutdown(app);
}

async function execute(logger: Logger): Promise<void> {
  // Get all transaction types that are related to a limit type.
  const transactionTypes = await getAllTransactionTypesWithLimitType();

  logger.debug('Transaction types found.', { transactionTypes });

  // If no transactionType is found, terminate this execution.
  if (!transactionTypes?.length) return;

  for (const transactionType of transactionTypes) {
    // Validate data.
    if (!transactionType?.limitType?.periodStart) {
      logger.error('Invalid transaction type.', { transactionType });
      continue;
    }

    const createdAtStartMonthly =
      transactionType.limitType.periodStart === LimitTypePeriodStart.DATE
        ? getMoment().startOf('month').toDate()
        : getMoment().subtract(1, 'month').toDate();

    const createdAtEnd = getMoment().toDate();

    // Update used monthly limits.
    await updateUserLimitTrackerByTransactionTypeAndDateRange(
      logger,
      transactionType,
      createdAtStartMonthly,
      createdAtEnd,
    );
  }

  for (const transactionType of transactionTypes) {
    // Validate data.
    if (!transactionType?.limitType?.periodStart) {
      logger.error('Invalid transaction type.', { transactionType });
      continue;
    }

    const createdAtStartAnnual =
      transactionType.limitType.periodStart === LimitTypePeriodStart.DATE
        ? getMoment().startOf('year').toDate()
        : getMoment().subtract(1, 'year').toDate();

    const createdAtEnd = getMoment().toDate();

    // Update used annual limits.
    await updateUserLimitTrackerByTransactionTypeAndDateRange(
      logger,
      transactionType,
      createdAtStartAnnual,
      createdAtEnd,
    );
  }
}

/**
 * Updates all UserLimitTracker by transaction type and date range.
 *
 * @param logger Logger.
 * @param transactionType Transaction type.
 * @param createdAtStart Created at start.
 * @param createdAtEnd Created at end.
 */
async function updateUserLimitTrackerByTransactionTypeAndDateRange(
  logger: Logger,
  transactionType: TransactionType,
  createdAtStart: Date,
  createdAtEnd: Date,
): Promise<void> {
  // Initial pagination.
  const pagination = new PaginationEntity({
    page: FIRST_PAGE,
    pageSize: PAGE_SIZE,
    sort: OperationRequestSort.CREATED_AT,
    order: PaginationOrder.ASC,
  });

  const filter: TGetOperationsFilter = {
    createdAtStart,
    createdAtEnd,
  };

  // While there are more pages to analyze the data, go on.
  let goOn = true;

  while (goOn) {
    // Get all operations from one year ago that are related to the found transaction types.
    const operationsPaginated =
      await getAllOperationsByTransactionTypeAndCurrencyAndPagination(
        transactionType,
        transactionType.limitType.currency,
        pagination,
        filter,
      );

    logger.info('Operations found.', {
      transactionTag: transactionType.tag,
      page: operationsPaginated.page,
      pageSize: operationsPaginated.pageSize,
      pageTotal: operationsPaginated.pageTotal,
      total: operationsPaginated.total,
    });

    // If no operation is found, go to next transaction type.
    if (!operationsPaginated?.data?.length) {
      goOn = false;
    }

    if (goOn) {
      for (const operation of operationsPaginated.data) {
        // Get the user limit that is related to the found operation.
        const userLimit = await getTUserLimit(operation);

        logger.debug('User limit found.', {
          userLimit,
        });

        // If no user limit is found, go to next operation.
        if (!userLimit) continue;

        // Get user limit tracker.
        let userLimitTracker = await getUserLimitTrackerByUserLimit(userLimit);

        logger.debug('User limit tracker found.', {
          userLimitTracker,
        });

        if (!userLimitTracker) {
          userLimitTracker = new UserLimitTrackerEntity({
            id: uuidV4(),
            userLimit,
            periodStart: transactionType.limitType.periodStart,
            usedDailyLimit: 0,
            usedMonthlyLimit: 0,
            usedAnnualLimit: 0,
            usedNightlyLimit: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // Update user limits tracker.
        const userLimitTrackerUpdated = await updateUserLimitTracker(
          userLimit,
          userLimitTracker,
        );

        logger.debug('User limit tracker updated.', {
          userLimitTracker: userLimitTrackerUpdated,
        });
      }

      operationsPaginated.page < operationsPaginated.pageTotal
        ? (goOn = true)
        : (goOn = false);
    }
  }
}

/**
 * Updates all UserLimitTracker indirectly associated to TUserLimits.
 *
 * @param userLimits TUserLimits data.
 */
async function updateUserLimitTracker(
  userLimit: TUserLimit,
  userLimitTracker: UserLimitTracker,
): Promise<UserLimitTracker> {
  // If true, update user limit tracker.
  let updateUserLimitTracker = false;
  // Include analysis tags into operation.
  const updateOperation: Partial<Operation> = {
    id: userLimit.operation.id,
    userLimitTracker,
    analysisTags: [],
  };

  // Starting day, month and year for DATE user limit period start types.
  const startOfDay = getMoment().startOf('day').toDate();
  const startOfMonth = getMoment().startOf('month').toDate();
  const startOfYear: any = getMoment().startOf('year').toDate();
  // Starting day, month and year for INTERVAL user limit period start types.
  const dayInterval = getMoment().subtract(1, 'day').toDate();
  const monthInterval = getMoment().subtract(1, 'month').toDate();
  const yearInterval: any = getMoment().subtract(1, 'year').toDate();

  // Update user limit tracker constants for DATE user limit period start types.
  if (
    userLimit.operation.transactionType.limitType.periodStart ===
    LimitTypePeriodStart.DATE
  ) {
    if (userLimit.operation.createdAt >= startOfDay) {
      userLimitTracker.usedDailyLimit += userLimit.operation.value;
      updateUserLimitTracker = true;
    }
    if (userLimit.operation.createdAt >= startOfMonth) {
      userLimitTracker.usedMonthlyLimit += userLimit.operation.value;
      updateUserLimitTracker = true;
    }
    if (userLimit.operation.createdAt >= startOfYear) {
      userLimitTracker.usedAnnualLimit += userLimit.operation.value;
      updateUserLimitTracker = true;
    }
    if (
      userLimit.nightlyLimit &&
      userLimit.nighttimeStart &&
      userLimit.nighttimeEnd &&
      isInNighttimeInterval(userLimit)
    ) {
      userLimitTracker.usedNightlyLimit += userLimit.operation.value;
      updateUserLimitTracker = true;
    }
  }

  // Update operation analysis tags if necessary.
  if (updateUserLimitTracker) {
    updateOperation.analysisTags.push(OperationAnalysisTag.DATE_LIMIT_INCLUDED);
  }

  // Update user limit tracker constants for INTERVAL user limit period start types.
  if (
    userLimit.operation.transactionType.limitType.periodStart ===
    LimitTypePeriodStart.INTERVAL
  ) {
    if (userLimit.operation.createdAt >= dayInterval) {
      userLimitTracker.usedDailyLimit += userLimit.operation.value;
      updateUserLimitTracker = true;
      updateOperation.analysisTags.push(
        OperationAnalysisTag.DAILY_INTERVAL_LIMIT_INCLUDED,
      );
    }
    if (userLimit.operation.createdAt >= monthInterval) {
      userLimitTracker.usedMonthlyLimit += userLimit.operation.value;
      updateUserLimitTracker = true;
      updateOperation.analysisTags.push(
        OperationAnalysisTag.MONTHLY_INTERVAL_LIMIT_INCLUDED,
      );
    }
    if (userLimit.operation.createdAt >= yearInterval) {
      userLimitTracker.usedAnnualLimit += userLimit.operation.value;
      updateUserLimitTracker = true;
      updateOperation.analysisTags.push(
        OperationAnalysisTag.ANNUAL_INTERVAL_LIMIT_INCLUDED,
      );
    }
    if (
      userLimit.nightlyLimit &&
      userLimit.nighttimeStart &&
      userLimit.nighttimeEnd &&
      isInNighttimeInterval(userLimit)
    ) {
      userLimitTracker.usedNightlyLimit += userLimit.operation.value;
      updateUserLimitTracker = true;
    }
  }

  // Create or update update user limit tracker and operation if necessary.
  if (updateUserLimitTracker) {
    await createOrUpdateUserLimitTracker(userLimitTracker);
  }

  // It will update to [] if no tag has been included.
  await updateOperationAnalysisTagsAndUserLimitTracker(updateOperation);

  return userLimitTracker;
}

/**
 * Update operation analysis tags and user limit tracker.
 *
 * @param operation Operation to be updated.
 * @returns Updated operation.
 */
async function updateOperationAnalysisTagsAndUserLimitTracker(
  operation: Partial<Operation>,
): Promise<Partial<Operation>> {
  await OperationModel.update(
    {
      analysisTags: operation.analysisTags,
      userLimitTrackerId: operation.userLimitTracker.id,
    },
    {
      where: { id: operation.id },
    },
  );

  return operation;
}

/**
 * Create or update UserLimitTracker.
 *
 * @param userLimitTracker New or existing UserLimitTracker.
 * @returns Created or updated UserLimitTracker.
 */
async function createOrUpdateUserLimitTracker(
  userLimitTracker: UserLimitTracker,
): Promise<UserLimitTracker> {
  // If the user limit tracker exists, update the existing record. If not, create a new one.
  const existingUserLimitTracker = await UserLimitTrackerModel.findOne({
    where: { id: userLimitTracker.id },
  });

  if (existingUserLimitTracker) {
    await UserLimitTrackerModel.update(userLimitTracker, {
      where: {
        id: userLimitTracker.id,
      },
    });

    return userLimitTracker;
  } else {
    const createdUserLimitTracker =
      await UserLimitTrackerModel.create(userLimitTracker);

    userLimitTracker.id = createdUserLimitTracker.id;
    userLimitTracker.createdAt = createdUserLimitTracker.createdAt;

    return userLimitTracker;
  }
}

/**
 * Returns if operation createdAt date in within user limit night time interval.
 *
 * @param userLimit TUserLimit data.
 * @returns boolean.
 */
function isInNighttimeInterval(userLimit: TUserLimit): boolean {
  if (
    !!userLimit.nighttimeStart &&
    !!userLimit.nighttimeEnd &&
    validateHourTimeFormat(userLimit.nighttimeStart) &&
    validateHourTimeFormat(userLimit.nighttimeEnd)
  )
    return false;

  const start = getMoment(userLimit.nighttimeStart, TIME_FORMAT);
  const end = getMoment(userLimit.nighttimeEnd, TIME_FORMAT);
  const base = getMoment();

  if (start.isAfter(end)) {
    end.add(1, 'day');
  }

  if (base.isBefore(start)) {
    start.subtract(1, 'day');
    end.subtract(1, 'day');
  }

  return base.isBetween(start, end, undefined, '[)');
}

/**
 * Gets all transaction types that have a limit type.
 *
 * @returns Transaction types found or null otherwise.
 */
async function getAllTransactionTypesWithLimitType(): Promise<
  TransactionType[]
> {
  // Get all transaction types that are related to a limit type.
  const transactionTypes = await TransactionTypeModel.findAll({
    where: {
      limitTypeId: {
        [Op.not]: null,
      },
    },
  }).then((data) => data.map(TransactionTypeDatabaseRepository.toDomain));

  const transactionTypesWithLimitType: TransactionType[] = [];

  for (const transactionType of transactionTypes) {
    const limitType = await LimitTypeModel.findOne({
      where: {
        id: transactionType.limitType.id,
      },
    }).then(LimitTypeDatabaseRepository.toDomain);

    transactionType.limitType = limitType;
    transactionTypesWithLimitType.push(transactionType);
  }

  return transactionTypesWithLimitType;
}

/**
 * Gets all key information of operations that contain transaction types related to limit types.
 *
 * @param transactionTypes Array of TTransactionType.
 * @returns Array of TOperation paginated.
 */
async function getAllOperationsByTransactionTypeAndCurrencyAndPagination(
  transactionType: TransactionType,
  currency: Currency,
  pagination: Pagination,
  filter: TGetOperationsFilter,
): Promise<TPaginationResponse<Operation>> {
  const { createdAtStart, createdAtEnd } = filter;

  const where = {
    state: {
      [Op.in]: [OperationState.PENDING, OperationState.ACCEPTED],
    },
    transactionTypeId: transactionType.id,
    currencyId: currency.id,
    analysisTags: {
      [Op.eq]: null,
    },
    userLimitTrackerId: {
      [Op.eq]: null,
    },
    ...(filter.createdAtStart &&
      filter.createdAtEnd && {
        createdAt: {
          [Op.between]: [
            getMoment(createdAtStart).startOf('day').toISOString(),
            getMoment(createdAtEnd).endOf('day').toISOString(),
          ],
        },
      }),
  };

  const operations = await OperationModel.findAndCountAll({
    where,
    ...paginationWhere(pagination),
  }).then((data) => {
    return paginationToDomain(
      pagination,
      data.count,
      data.rows.map(OperationDatabaseRepository.toDomain),
    );
  });

  if (!operations?.data?.length) return operations;

  operations.data.map(
    (operation) => (operation.transactionType = transactionType),
  );

  return operations;
}

/**
 * Gets all key information of user limits that are indirectly related to the found operations.
 *
 * @param operations Array of TOperation.
 * @returns Array of TUserLimit.
 */
async function getTUserLimit(operation: Operation): Promise<TUserLimit> {
  let user = null;
  if (operation.transactionType.limitType.check === LimitTypeCheck.BOTH) {
    user = operation.owner || operation.beneficiary;
  } else {
    user =
      operation.transactionType.limitType.check === LimitTypeCheck.OWNER
        ? operation.owner
        : operation.beneficiary;
  }

  if (!user?.id) return;

  let userLimit = await UserLimitModel.findOne<UserLimitModel>({
    where: {
      userId: user.id,
      limitTypeId: operation.transactionType.limitType.id,
    },
  }).then(UserLimitDatabaseRepository.toDomain);

  if (!userLimit) {
    userLimit = await createUserLimitByUserAndLimitType(
      user,
      operation.transactionType.limitType,
    );
  }

  if (!userLimit) return;

  return { ...userLimit, operation };
}

/**
 * Get global limit by limit type.
 *
 * @param limitType Limit type.
 * @returns Global limit if found or null otherwise.
 */
async function getGlobalLimitByLimitType(
  limitType: LimitType,
): Promise<GlobalLimit> {
  return GlobalLimitModel.findOne({
    where: {
      limitTypeId: limitType.id,
    },
  }).then(GlobalLimitDatabaseRepository.toDomain);
}

/**
 * Create user limit by operation.
 *
 * @param userLimits TUserLimits data.
 */
async function createUserLimitByUserAndLimitType(
  user: User,
  limitType: LimitType,
): Promise<UserLimit> {
  const globalLimit = await getGlobalLimitByLimitType(limitType);

  // Sanity check.
  if (!globalLimit) {
    return;
  }

  const {
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
  } = globalLimit;

  //Create a default limit.
  const userLimit = new UserLimitEntity({
    id: uuidV4(),
    user,
    limitType,
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
  });

  await createUserLimit(userLimit);

  return userLimit;
}

/**
 * Create new user limit.
 *
 * @param userLimit UserLimits data.
 */
async function createUserLimit(userLimit: UserLimit): Promise<UserLimit> {
  const createdUserLimit = await UserLimitModel.create(userLimit);

  userLimit.id = createdUserLimit.id;

  return userLimit;
}

/**
 * Gets a user limit tracker by its user limit.
 *
 * @param userLimit UserLimit.
 * @returns UserLimitTracker found.
 */
async function getUserLimitTrackerByUserLimit(
  userLimit: UserLimit,
): Promise<UserLimitTracker> {
  return await UserLimitTrackerModel.findOne<UserLimitTrackerModel>({
    where: {
      userLimitId: userLimit.id,
    },
    lock: true,
  }).then(UserLimitTrackerDatabaseRepository.toDomain);
}

bootstrap().catch((error) => shutdown(app, error));
