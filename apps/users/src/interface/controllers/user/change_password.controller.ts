import { Logger } from 'winston';
import { IsUUID, IsStrongPassword } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User, UserEntity, UserRepository } from '@zro/users/domain';
import { ChangeUserPasswordUseCase } from '@zro/users/application';

type UserId = User['uuid'];
type Password = User['password'];

type TChangeUserPasswordRequest = {
  userId: UserId;
  password: Password;
};

export class ChangeUserPasswordRequest
  extends AutoValidator
  implements TChangeUserPasswordRequest
{
  @IsUUID(4)
  userId: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  password: Password;

  constructor(props: TChangeUserPasswordRequest) {
    super(props);
  }
}

type TChangeUserPasswordResponse = { id: Pick<User, 'uuid'>['uuid'] };

export class ChangeUserPasswordResponse
  extends AutoValidator
  implements TChangeUserPasswordResponse
{
  @IsUUID(4)
  id: string;

  constructor(props: TChangeUserPasswordResponse) {
    super(props);
  }
}

export class ChangeUserPasswordController {
  private usecase: ChangeUserPasswordUseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
  ) {
    this.logger = logger.child({
      context: ChangeUserPasswordController.name,
    });
    this.usecase = new ChangeUserPasswordUseCase(this.logger, userRepository);
  }

  async execute(
    request: ChangeUserPasswordRequest,
  ): Promise<ChangeUserPasswordResponse> {
    this.logger.debug('Change user password request.', { request });

    const { userId, password } = request;

    const user = new UserEntity({ uuid: userId });

    const updatedUser = await this.usecase.execute(user, password);

    const response = new ChangeUserPasswordResponse({ id: updatedUser.uuid });

    this.logger.info('Change user password response.', { user: response });

    return response;
  }
}
