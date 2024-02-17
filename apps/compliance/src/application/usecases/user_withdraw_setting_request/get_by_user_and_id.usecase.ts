import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  UserWithdrawSettingRequestRepository,
  UserWithdrawSettingRequest,
} from '@zro/compliance/domain';
import { User } from '@zro/users/domain';

export class GetUserWithdrawSettingRequestByUserAndIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userWithdrawSettingRequestRepository user withdraw setting request repository.
   */
  constructor(
    private logger: Logger,
    private readonly userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
  ) {
    this.logger = logger.child({
      context: GetUserWithdrawSettingRequestByUserAndIdUseCase.name,
    });
  }

  /**
   * Get a user withdraw setting request by user and id.
   */
  async execute(
    id: UserWithdrawSettingRequest['id'],
    user: User,
  ): Promise<UserWithdrawSettingRequest> {
    if (!id || !user?.uuid) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!user?.uuid ? ['User UUID'] : []),
      ]);
    }

    const userWithdrawSettingRequest =
      await this.userWithdrawSettingRequestRepository.getByUserAndId(user, id);

    this.logger.debug('User withdraw setting request found.', {
      userWithdrawSettingRequest,
    });

    return userWithdrawSettingRequest;
  }
}
