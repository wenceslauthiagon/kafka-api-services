import { Logger } from 'winston';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  User,
  UserForgotPassword,
  UserForgotPasswordRepository,
  UserForgotPasswordState,
  UserRepository,
} from '@zro/users/domain';
import { UpdateUserForgotPasswordUseCase } from '@zro/users/application';
import {
  UserForgotPasswordEventEmitterController,
  UserForgotPasswordEventEmitterControllerInterface,
} from '@zro/users/interface';

type TUpdateUserForgotPasswordRequest = Pick<
  UserForgotPassword,
  'id' | 'code'
> & {
  newPassword: string;
};

export class UpdateUserForgotPasswordRequest
  extends AutoValidator
  implements TUpdateUserForgotPasswordRequest
{
  @IsUUID()
  id: string;

  @IsString()
  @Length(5, 5)
  @Matches(/^[0-9]*$/)
  code: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  newPassword: string;

  constructor(props: TUpdateUserForgotPasswordRequest) {
    super(props);
  }
}

type TUpdateUserForgotPasswordResponse = {
  userId: User['uuid'];
  userPhoneNumber: User['phoneNumber'];
  state: UserForgotPasswordState;
};

export class UpdateUserForgotPasswordResponse
  extends AutoValidator
  implements TUpdateUserForgotPasswordResponse
{
  @IsEnum(UserForgotPasswordState)
  state: UserForgotPasswordState;

  @IsUUID(4)
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(25)
  userPhoneNumber: string;

  constructor(props: TUpdateUserForgotPasswordResponse) {
    super(props);
  }
}

export class UpdateUserForgotPasswordController {
  private usecase: UpdateUserForgotPasswordUseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
    userForgotPasswordRepository: UserForgotPasswordRepository,
    serviceEventEmitter: UserForgotPasswordEventEmitterControllerInterface,
    maxAttempts: number,
    expirationSeconds: number,
  ) {
    this.logger = logger.child({
      context: UpdateUserForgotPasswordController.name,
    });

    const eventEmitter = new UserForgotPasswordEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new UpdateUserForgotPasswordUseCase(
      this.logger,
      userRepository,
      userForgotPasswordRepository,
      eventEmitter,
      maxAttempts,
      expirationSeconds,
    );
  }

  async execute(
    request: UpdateUserForgotPasswordRequest,
  ): Promise<UpdateUserForgotPasswordResponse> {
    this.logger.debug('Create user forgot password request.', { request });

    const { id, code, newPassword } = request;

    const result = await this.usecase.execute(id, code, newPassword);

    const response = new UpdateUserForgotPasswordResponse({
      state: result.state,
      userId: result.user.uuid,
      userPhoneNumber: result.phoneNumber,
    });

    this.logger.info('Updated user forgot password response.', {
      userForgotPassword: response,
    });

    return response;
  }
}
