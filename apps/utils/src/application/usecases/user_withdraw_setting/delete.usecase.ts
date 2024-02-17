import { Logger } from 'winston';
import {
  UserWithdrawSettingRepository,
  WithdrawSettingState,
} from '@zro/utils/domain';
import {
  UserWithdrawSettingInvalidStateException,
  UserWithdrawSettingNotFoundException,
} from '@zro/utils/application';
import { MissingDataException } from '@zro/common';
export class DeleteUserWithdrawSettingUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userWithdrawSettingRepository UserWithdrawSetting repository.
   */
  constructor(
    private logger: Logger,
    private readonly userWithdrawSettingRepository: UserWithdrawSettingRepository,
  ) {
    this.logger = logger.child({
      context: DeleteUserWithdrawSettingUseCase.name,
    });
  }

  /**
   * Delete UserWithdrawSetting
   *
   * @returns UserWithdrawSetting deleted.
   * @throws {UserWithdrawSettingNotFoundException} Thrown when the UserWithdrawSetting not exists.
   * @throws {UserWithdrawSettingInvalidStateException} Thrown when the state is invalid.
   */
  async execute(id: string): Promise<void> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    const foundUserWithdrawSetting =
      await this.userWithdrawSettingRepository.getById(id);

    this.logger.debug('User withdraw setting found.', {
      userWithdrawSetting: foundUserWithdrawSetting,
    });

    if (!foundUserWithdrawSetting) {
      throw new UserWithdrawSettingNotFoundException({ id });
    }

    if (foundUserWithdrawSetting.state === WithdrawSettingState.DEACTIVE) {
      throw new UserWithdrawSettingInvalidStateException({
        state: foundUserWithdrawSetting.state,
      });
    }

    foundUserWithdrawSetting.state = WithdrawSettingState.DEACTIVE;
    foundUserWithdrawSetting.deletedAt = new Date();

    await this.userWithdrawSettingRepository.update(foundUserWithdrawSetting);

    this.logger.debug('UserWithdrawSetting deleted.');
  }
}
