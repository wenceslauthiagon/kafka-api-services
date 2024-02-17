import { Logger } from 'winston';
import {
  LimitType,
  UserLimit,
  UserLimitEntity,
  UserLimitRepository,
} from '@zro/operations/domain';
import { UpdateUserLimitByAdminUseCase as UseCase } from '@zro/operations/application';
import {
  UserLimitEventEmitterControllerInterface,
  UserLimitEventEmitterController,
} from '@zro/operations/interface';

export type UpdateUserLimitByAdminRequest = Partial<
  Pick<
    UserLimit,
    | 'nightlyLimit'
    | 'dailyLimit'
    | 'monthlyLimit'
    | 'yearlyLimit'
    | 'maxAmount'
    | 'minAmount'
    | 'maxAmountNightly'
    | 'minAmountNightly'
  >
> & { userLimitId: UserLimit['id'] };

export type UpdateUserLimitByAdminResponse = Pick<
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

function updateUserLimitByAdminPresenter(
  userLimit: UserLimit,
): UpdateUserLimitByAdminResponse {
  return {
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
  };
}

export class UpdateUserLimitByAdminController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    userLimitRepository: UserLimitRepository,
    serviceEventEmitter: UserLimitEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: UpdateUserLimitByAdminController.name,
    });

    const eventEmitter = new UserLimitEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new UseCase(this.logger, userLimitRepository, eventEmitter);
  }

  async execute(
    request: UpdateUserLimitByAdminRequest,
  ): Promise<UpdateUserLimitByAdminResponse> {
    this.logger.debug('Update user limit by admin.', { request });

    const {
      userLimitId,
      yearlyLimit,
      monthlyLimit,
      dailyLimit,
      nightlyLimit,
      maxAmount,
      minAmount,
      maxAmountNightly,
      minAmountNightly,
    } = request;

    const userLimit = new UserLimitEntity({ id: userLimitId });

    const newUserLimit = new UserLimitEntity({
      ...(yearlyLimit ? { yearlyLimit } : {}),
      ...(monthlyLimit ? { monthlyLimit } : {}),
      ...(dailyLimit ? { dailyLimit } : {}),
      ...(nightlyLimit ? { nightlyLimit } : {}),
      ...(maxAmount ? { maxAmount } : {}),
      ...(minAmount ? { minAmount } : {}),
      ...(maxAmountNightly ? { maxAmountNightly } : {}),
      ...(minAmountNightly ? { minAmountNightly } : {}),
    });

    const userLimitUpdated = await this.usecase.execute(
      userLimit,
      newUserLimit,
    );

    return updateUserLimitByAdminPresenter(userLimitUpdated);
  }
}
