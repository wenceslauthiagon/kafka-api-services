import { Logger } from 'winston';
import { Signup, SignupRepository, SignupState } from '@zro/signup/domain';
import { UserService } from '@zro/signup/application';
import {
  AutoValidator,
  IsMobilePhone,
  MaxLength,
  MinLength,
} from '@zro/common';
import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
} from 'class-validator';

import { CreateSignupUseCase } from '@zro/signup/application';

type TCreateSignupRequest = Pick<
  Signup,
  'id' | 'name' | 'password' | 'phoneNumber' | 'referralCode' | 'email'
>;

export class CreateSignupRequest
  extends AutoValidator
  implements TCreateSignupRequest
{
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsMobilePhone()
  phoneNumber: string;

  @IsOptional()
  @MaxLength(20)
  referralCode: string;

  @IsEmail()
  email: string;

  constructor(props: TCreateSignupRequest) {
    super(props);
  }
}

type TCreateSignupResponse = Pick<Signup, 'id' | 'state'>;

export class CreateSignupResponse
  extends AutoValidator
  implements TCreateSignupResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(SignupState)
  state: SignupState;

  constructor(props: TCreateSignupResponse) {
    super(props);
  }
}

export class CreateSignupController {
  private usecase: CreateSignupUseCase;

  constructor(
    private logger: Logger,
    private readonly signupRepository: SignupRepository,
    private readonly userService: UserService,
  ) {
    this.logger = logger.child({
      context: CreateSignupController.name,
    });
    this.usecase = new CreateSignupUseCase(
      this.logger,
      this.signupRepository,
      this.userService,
    );
  }

  async execute(request: CreateSignupRequest): Promise<CreateSignupResponse> {
    this.logger.debug('Create signup request.', { request });

    const { id, name, password, phoneNumber, referralCode, email } = request;

    const createSignup = await this.usecase.execute({
      id,
      name,
      password,
      phoneNumber,
      referralCode,
      email,
    });

    if (!createSignup) return null;

    const response = new CreateSignupResponse({
      id: createSignup.id,
      state: createSignup.state,
    });

    this.logger.info('Create signup response.', {
      signup: response,
    });

    return response;
  }
}
