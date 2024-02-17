import { Logger } from 'winston';
import {
  GlobalLimitRepository,
  LimitType,
  LimitTypeEntity,
  LimitTypeRepository,
  UserLimit,
  UserLimitEntity,
  UserLimitRepository,
} from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';
import { UserNotFoundException } from '@zro/users/application';
import {
  UpdateUserLimitUseCase as UseCase,
  UserService,
} from '@zro/operations/application';
import {
  UserLimitEventEmitterControllerInterface,
  UserLimitEventEmitterController,
} from '@zro/operations/interface';

export type UpdateUserLimitRequest = Partial<
  Pick<
    UserLimit,
    | 'userNightlyLimit'
    | 'userDailyLimit'
    | 'userMonthlyLimit'
    | 'userYearlyLimit'
    | 'userMaxAmount'
    | 'userMinAmount'
    | 'userMaxAmountNightly'
    | 'userMinAmountNightly'
    | 'nighttimeStart'
    | 'nighttimeEnd'
  >
> & { userId: User['uuid']; limitTypesIds: LimitType['id'][] };

export type UpdateUserLimitItem = Pick<
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
> & { limitTypeId: LimitType['id'] };

export type UpdateUserLimitResponse = UpdateUserLimitItem[];

function updateUserLimitPresenter(
  userLimits: UserLimit[],
): UpdateUserLimitResponse {
  if (!userLimits) return null;

  const response = userLimits.map<UpdateUserLimitItem>((userLimit) => ({
    id: userLimit.id,
    limitTypeId: userLimit.limitType.id,
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
  }));

  return response;
}

export class UpdateUserLimitController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    userLimitRepository: UserLimitRepository,
    globalLimitRepository: GlobalLimitRepository,
    limitTypeRepository: LimitTypeRepository,
    serviceEventEmitter: UserLimitEventEmitterControllerInterface,
    nighttimeIntervals: string,
    private userService: UserService,
  ) {
    this.logger = logger.child({ context: UpdateUserLimitController.name });

    const eventEmitter = new UserLimitEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      userLimitRepository,
      globalLimitRepository,
      limitTypeRepository,
      eventEmitter,
      nighttimeIntervals,
    );
  }

  async execute(
    request: UpdateUserLimitRequest,
  ): Promise<UpdateUserLimitResponse> {
    this.logger.debug('Update User Limit.', { request });

    const {
      userId,
      limitTypesIds,
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
    } = request;

    const userFound = await this.userService.getUserByUuid({ userId });

    if (!userFound) {
      throw new UserNotFoundException({ uuid: userId });
    }

    const user = new UserEntity({ id: userFound.id, uuid: userFound.uuid });

    const limitTypes = limitTypesIds.map(
      (limitTypeId) => new LimitTypeEntity({ id: limitTypeId }),
    );

    const newUserLimit = new UserLimitEntity({
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

    const userLimitUpdated = await this.usecase.execute(
      user,
      limitTypes,
      newUserLimit,
    );

    return updateUserLimitPresenter(userLimitUpdated);
  }
}
