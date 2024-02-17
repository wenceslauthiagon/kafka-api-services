import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  LimitType,
  UserLimit,
  UserLimitRepository,
} from '@zro/operations/domain';
import { UserNotFoundException } from '@zro/users/application';
import {
  GetUserLimitByIdAndUser as UseCase,
  UserService,
} from '@zro/operations/application';

export type GetUserLimitByIdAndUserRequest = {
  id: string;
  userId: User['uuid'];
};

export type GetUserLimitByIdAndUserResponse = Pick<
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
> & {
  limitTypeId: LimitType['id'];
  limitTypeDescription: LimitType['description'];
};

function getUserLimitByIdAndUserPresenter(
  userLimit: UserLimit,
): GetUserLimitByIdAndUserResponse {
  if (!userLimit) return null;

  return {
    id: userLimit.id,
    limitTypeId: userLimit.limitType.id,
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
  };
}

export class GetUserLimitByIdAndUserController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    userLimitRepository: UserLimitRepository,
    private userService: UserService,
  ) {
    this.logger = logger.child({
      context: GetUserLimitByIdAndUserController.name,
    });

    this.usecase = new UseCase(this.logger, userLimitRepository);
  }

  async execute(
    request: GetUserLimitByIdAndUserRequest,
  ): Promise<GetUserLimitByIdAndUserResponse> {
    this.logger.debug('Get User Limit by id and user.', { request });

    const { id, userId } = request;

    if (!userId) {
      throw new MissingDataException(['User Id']);
    }

    const userFound = await this.userService.getUserByUuid({ userId });

    if (!userFound) {
      throw new UserNotFoundException({ uuid: userId });
    }

    const user = new UserEntity({ id: userFound.id });

    const result = await this.usecase.execute(id, user);

    return getUserLimitByIdAndUserPresenter(result);
  }
}
