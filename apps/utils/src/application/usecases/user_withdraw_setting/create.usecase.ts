import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { PixKey } from '@zro/pix-keys/domain';
import { WithdrawSettingType } from '@zro/compliance/domain';
import { TransactionType, Wallet } from '@zro/operations/domain';
import {
  UserWithdrawSetting,
  UserWithdrawSettingEntity,
  UserWithdrawSettingRepository,
  WithdrawSettingState,
} from '@zro/utils/domain';
import { UserWithdrawSettingEventEmitter } from '@zro/utils/application';

export class CreateUserWithdrawSettingUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userWithdrawSettingRepository user withdraw setting repository.
   * @param eventEmitter user withdraw setting event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly userWithdrawSettingRepository: UserWithdrawSettingRepository,
    private readonly eventEmitter: UserWithdrawSettingEventEmitter,
  ) {
    this.logger = logger.child({
      context: CreateUserWithdrawSettingUseCase.name,
    });
  }

  /**
   * Create user withdraw setting.
   */
  async execute(
    id: UserWithdrawSetting['id'],
    type: UserWithdrawSetting['type'],
    balance: UserWithdrawSetting['balance'],
    day: UserWithdrawSetting['day'],
    weekDay: UserWithdrawSetting['weekDay'],
    wallet: Wallet,
    user: User,
    transactionType: TransactionType,
    pixKey: PixKey,
  ): Promise<UserWithdrawSetting> {
    if (
      !id ||
      !type ||
      !balance ||
      !wallet?.uuid ||
      !user?.uuid ||
      !transactionType?.tag ||
      !pixKey?.type ||
      !pixKey.key
    ) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!type ? ['Type'] : []),
        ...(!balance ? ['Balance'] : []),
        ...(!wallet?.uuid ? ['Wallet UUID'] : []),
        ...(!user?.uuid ? ['User UUID'] : []),
        ...(!transactionType?.tag ? ['TransactionType Tag'] : []),
        ...(!pixKey?.type ? ['Pix Key Type'] : []),
        ...(!pixKey?.key ? ['Pix Key'] : []),
      ]);
    }

    if (type === WithdrawSettingType.WEEKLY && !weekDay) {
      throw new MissingDataException(['Week Day']);
    }

    if (type === WithdrawSettingType.MONTHLY && !day) {
      throw new MissingDataException(['Day']);
    }

    const userWithdrawSettingFound =
      await this.userWithdrawSettingRepository.getById(id);

    this.logger.debug('User withdraw setting if same id.', {
      userWithdrawSettingFound,
    });

    if (userWithdrawSettingFound) {
      return userWithdrawSettingFound;
    }

    const userWithdrawSetting = new UserWithdrawSettingEntity({
      id,
      type,
      balance,
      state: WithdrawSettingState.ACTIVE,
      wallet,
      user,
      transactionType,
      pixKey,
      ...(type === WithdrawSettingType.WEEKLY ? { weekDay } : {}),
      ...(type === WithdrawSettingType.MONTHLY ? { day } : {}),
    });

    const userWithdrawSettingCreated =
      await this.userWithdrawSettingRepository.create(userWithdrawSetting);

    this.eventEmitter.created(userWithdrawSettingCreated);

    this.logger.debug('User withdraw setting created.', {
      userWithdrawSettingCreated,
    });

    return userWithdrawSettingCreated;
  }
}
