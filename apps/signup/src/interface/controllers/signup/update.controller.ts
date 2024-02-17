import { Logger } from 'winston';
import {
  Signup,
  SignupEntity,
  SignupRepository,
  SignupState,
} from '@zro/signup/domain';
import { AutoValidator, IsMobilePhone, MaxLength } from '@zro/common';
import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsEmail,
  IsEnum,
} from 'class-validator';

import { UpdateSignupUseCase } from '@zro/signup/application';

type TUpdateSignupRequest = Pick<
  Signup,
  'id' | 'name' | 'password' | 'phoneNumber' | 'referralCode' | 'email'
>;

export class UpdateSignupRequest
  extends AutoValidator
  implements TUpdateSignupRequest
{
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password: string;

  @IsOptional()
  @IsMobilePhone()
  phoneNumber: string;

  @IsOptional()
  @IsNotEmpty()
  @MaxLength(20)
  referralCode: string;

  @IsOptional()
  @IsEmail()
  email: string;

  constructor(props: TUpdateSignupRequest) {
    super(props);
  }
}

type TUpdateSignupResponse = Pick<Signup, 'id' | 'state'>;

export class UpdateSignupResponse
  extends AutoValidator
  implements TUpdateSignupResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(SignupState)
  state: SignupState;

  constructor(props: TUpdateSignupResponse) {
    super(props);
  }
}

export class UpdateSignupController {
  private usecase: UpdateSignupUseCase;

  constructor(
    private logger: Logger,
    private readonly signupRepository: SignupRepository,
  ) {
    this.logger = logger.child({
      context: UpdateSignupController.name,
    });
    this.usecase = new UpdateSignupUseCase(this.logger, this.signupRepository);
  }

  async execute(request: UpdateSignupRequest): Promise<UpdateSignupResponse> {
    this.logger.debug('Update signup request.', { request });

    const { id, name, password, phoneNumber, referralCode, email } = request;

    const signup = new SignupEntity({
      id,
      name,
      password,
      phoneNumber,
      referralCode,
      email,
    });

    const updatedSignup = await this.usecase.execute(signup);

    if (!updatedSignup) {
      return null;
    }

    const response = new UpdateSignupResponse({
      id: updatedSignup.id,
      state: updatedSignup.state,
    });

    this.logger.info('Update signup response.', {
      signup: response,
    });

    return response;
  }
}
