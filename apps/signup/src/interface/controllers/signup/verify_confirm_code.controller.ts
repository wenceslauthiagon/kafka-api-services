import { Logger } from 'winston';
import {
  Signup,
  SignupEntity,
  SignupRepository,
  SignupState,
} from '@zro/signup/domain';
import { AutoValidator } from '@zro/common';
import { IsUUID, IsString, Length, IsEnum } from 'class-validator';

import { VerifyConfirmCodeSignupUseCase } from '@zro/signup/application';
import {
  SignupEventEmitterController,
  SignupEventEmitterControllerInterface,
} from '@zro/signup/interface';

type TVerifyConfirmCodeSignupRequest = Pick<Signup, 'id' | 'confirmCode'>;

export class VerifyConfirmCodeSignupRequest
  extends AutoValidator
  implements TVerifyConfirmCodeSignupRequest
{
  @IsUUID()
  id: string;

  @IsString()
  @Length(5, 5)
  confirmCode: string;

  constructor(props: TVerifyConfirmCodeSignupRequest) {
    super(props);
  }
}

type TVerifyConfirmCodeSignupResponse = Pick<Signup, 'id' | 'state'>;

export class VerifyConfirmCodeSignupResponse
  extends AutoValidator
  implements TVerifyConfirmCodeSignupResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(SignupState)
  state: SignupState;

  constructor(props: TVerifyConfirmCodeSignupResponse) {
    super(props);
  }
}

export class VerifyConfirmCodeSignupController {
  private usecase: VerifyConfirmCodeSignupUseCase;

  constructor(
    private logger: Logger,
    private readonly userRepository: SignupRepository,
    private readonly maxNumberOfAttempts: number,
    private readonly eventEmitter: SignupEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: VerifyConfirmCodeSignupController.name,
    });

    const eventEmitterController = new SignupEventEmitterController(
      this.eventEmitter,
    );

    this.usecase = new VerifyConfirmCodeSignupUseCase(
      this.logger,
      this.userRepository,
      this.maxNumberOfAttempts,
      eventEmitterController,
    );
  }

  async execute(
    request: VerifyConfirmCodeSignupRequest,
  ): Promise<VerifyConfirmCodeSignupResponse> {
    this.logger.debug('VerifyConfirmCode signup request.', { request });

    const { id, confirmCode } = request;

    const signup = new SignupEntity({ id });

    const createSignup = await this.usecase.execute(signup, confirmCode);

    if (!createSignup) {
      return null;
    }

    const response = new VerifyConfirmCodeSignupResponse({
      id: createSignup.id,
      state: createSignup.state,
    });

    this.logger.info('VerifyConfirmCode signup response.', {
      signup: response,
    });

    return response;
  }
}
