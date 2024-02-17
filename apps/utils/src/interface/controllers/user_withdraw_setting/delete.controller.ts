import { Logger } from 'winston';
import {
  UserWithdrawSetting,
  UserWithdrawSettingRepository,
} from '@zro/utils/domain';
import { AutoValidator } from '@zro/common';
import { IsUUID } from 'class-validator';
import { DeleteUserWithdrawSettingUseCase } from '@zro/utils/application';

type TDeleteUserWithdrawSettingRequest = Pick<UserWithdrawSetting, 'id'>;

export class DeleteUserWithdrawSettingRequest
  extends AutoValidator
  implements TDeleteUserWithdrawSettingRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: TDeleteUserWithdrawSettingRequest) {
    super(props);
  }
}

export class DeleteUserWithdrawSettingController {
  private usecase: DeleteUserWithdrawSettingUseCase;

  constructor(
    private logger: Logger,
    userWithdrawSettingRepository: UserWithdrawSettingRepository,
  ) {
    this.logger = logger.child({
      context: DeleteUserWithdrawSettingController.name,
    });

    this.usecase = new DeleteUserWithdrawSettingUseCase(
      this.logger,
      userWithdrawSettingRepository,
    );
  }

  async execute(request: DeleteUserWithdrawSettingRequest): Promise<void> {
    this.logger.debug('Delete user withdraw setting.', { request });

    const { id } = request;

    await this.usecase.execute(id);

    this.logger.debug('Delete user withdraw setting response.');
  }
}
