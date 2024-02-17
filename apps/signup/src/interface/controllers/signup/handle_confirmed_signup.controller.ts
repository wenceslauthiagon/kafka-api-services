import { Logger } from 'winston';
import { IsUUID, IsEnum } from 'class-validator';
import { AutoValidator, IsMobilePhone, MaxLength } from '@zro/common';
import {
  SignupEntity,
  SignupRepository,
  SignupState,
} from '@zro/signup/domain';
import {
  HandleConfirmedSignupUseCase,
  UserService,
} from '@zro/signup/application';
import {
  SignupControllerEvent,
  SignupEventEmitterController,
  SignupEventEmitterControllerInterface,
} from '@zro/signup/interface';

type THandleConfirmedSignupEventRequest = Pick<
  SignupControllerEvent,
  'id' | 'state' | 'phoneNumber'
>;

export class HandleConfirmedSignupEventRequest
  extends AutoValidator
  implements THandleConfirmedSignupEventRequest
{
  @IsUUID()
  id: string;

  @IsEnum(SignupState)
  state: SignupState;

  @IsMobilePhone()
  @MaxLength(15)
  phoneNumber: string;

  constructor(props: THandleConfirmedSignupEventRequest) {
    super(props);
  }
}

export class HandleConfirmedSignupEventController {
  private usecase: HandleConfirmedSignupUseCase;

  constructor(
    private logger: Logger,
    private readonly signupRepository: SignupRepository,
    private readonly userService: UserService,
    private readonly eventEmitter: SignupEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleConfirmedSignupEventController.name,
    });

    const eventEmitterController = new SignupEventEmitterController(
      this.eventEmitter,
    );

    this.usecase = new HandleConfirmedSignupUseCase(
      this.logger,
      this.signupRepository,
      this.userService,
      eventEmitterController,
    );
  }

  async execute(request: HandleConfirmedSignupEventRequest): Promise<void> {
    this.logger.debug('Handle confirmed signup request.', { request });

    const signup = new SignupEntity({ id: request.id });

    const response = await this.usecase.execute(signup);

    this.logger.debug('Handle confirmed signup response.', { response });
  }
}
