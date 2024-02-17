import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  GlobalLimitRepository,
  LimitType,
  LimitTypeRepository,
  UserLimit,
  UserLimitFilter,
  UserLimitRepository,
} from '@zro/operations/domain';
import { UserNotFoundException } from '@zro/users/application';
import {
  GetUserLimitsByFilterUseCase as UseCase,
  UserService,
} from '@zro/operations/application';
import {
  UserLimitEventEmitterController,
  UserLimitEventEmitterControllerInterface,
} from '@zro/operations/interface';

export type GetUserLimitsByFilterRequest = {
  userId?: User['uuid'];
  limitTypeId?: UserLimitFilter['limitTypeId'];
};

export type GetUserLimitByFilterItem = Partial<
  Pick<
    UserLimit,
    | 'id'
    | 'nightlyLimit'
    | 'userNightlyLimit'
    | 'dailyLimit'
    | 'userDailyLimit'
    | 'monthlyLimit'
    | 'userMonthlyLimit'
    | 'yearlyLimit'
    | 'userYearlyLimit'
    | 'maxAmount'
    | 'minAmount'
    | 'maxAmountNightly'
    | 'minAmountNightly'
    | 'userMaxAmount'
    | 'userMinAmount'
    | 'userMaxAmountNightly'
    | 'userMinAmountNightly'
    | 'nighttimeStart'
    | 'nighttimeEnd'
    | 'creditBalance'
  >
> & {
  limitTypeId: LimitType['id'];
  limitTypeTag: LimitType['tag'];
  limitTypeDescription: LimitType['description'];
};

export type GetUserLimitsByFilterResponse = GetUserLimitByFilterItem[];

function getUserLimitsByFilterPresenter(
  userLimits: UserLimit[],
): GetUserLimitByFilterItem[] {
  const response = userLimits.map<GetUserLimitByFilterItem>((userLimit) => ({
    id: userLimit.id,
    limitTypeId: userLimit.limitType.id,
    limitTypeTag: userLimit.limitType.tag,
    limitTypeDescription: userLimit.limitType.description,
    nightlyLimit: userLimit.nightlyLimit,
    userNightlyLimit: userLimit.userNightlyLimit,
    dailyLimit: userLimit.dailyLimit,
    userDailyLimit: userLimit.userDailyLimit,
    monthlyLimit: userLimit.monthlyLimit,
    userMonthlyLimit: userLimit.userMonthlyLimit,
    yearlyLimit: userLimit.yearlyLimit,
    userYearlyLimit: userLimit.userYearlyLimit,
    maxAmount: userLimit.maxAmount,
    minAmount: userLimit.minAmount,
    maxAmountNightly: userLimit.maxAmountNightly,
    minAmountNightly: userLimit.minAmountNightly,
    userMaxAmount: userLimit.userMaxAmount,
    userMinAmount: userLimit.userMinAmount,
    userMaxAmountNightly: userLimit.userMaxAmountNightly,
    userMinAmountNightly: userLimit.userMinAmountNightly,
    nighttimeStart: userLimit.nighttimeStart,
    nighttimeEnd: userLimit.nighttimeEnd,
    creditBalance: userLimit.creditBalance,
  }));

  return response;
}

export class GetUserLimitsByFilterController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    userLimitRepository: UserLimitRepository,
    globalLimitRepository: GlobalLimitRepository,
    limitTypeRepository: LimitTypeRepository,
    private userService: UserService,
    serviceEventEmitter: UserLimitEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: GetUserLimitsByFilterController.name,
    });

    const eventEmitter = new UserLimitEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      userLimitRepository,
      globalLimitRepository,
      limitTypeRepository,
      eventEmitter,
    );
  }

  async execute(
    request: GetUserLimitsByFilterRequest,
  ): Promise<GetUserLimitsByFilterResponse> {
    this.logger.debug('Get User Limits.', { request });

    const { userId, limitTypeId } = request;

    if (!userId) {
      throw new MissingDataException(['User Id']);
    }

    const userFound = await this.userService.getUserByUuid({ userId });

    if (!userFound) {
      throw new UserNotFoundException({ uuid: userId });
    }

    const filter: UserLimitFilter = {
      userId: userFound.id,
      ...(limitTypeId && { limitTypeId }),
    };

    const results = await this.usecase.execute(filter);

    return getUserLimitsByFilterPresenter(results);
  }
}
