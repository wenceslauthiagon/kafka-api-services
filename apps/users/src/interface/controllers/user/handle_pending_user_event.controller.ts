import { Logger } from 'winston';
import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsEnum,
  MaxLength,
  IsInt,
  IsPositive,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  UserOnboardingRepository,
  UserPinAttemptsRepository,
  UserRepository,
  UserSettingRepository,
  UserState,
} from '@zro/users/domain';
import {
  HandlePendingUserEventUseCase,
  UserEvent,
} from '@zro/users/application';

type THandlePendingUserEventRequest = Pick<
  UserEvent,
  'id' | 'uuid' | 'name' | 'state' | 'phoneNumber'
>;

export class HandlePendingUserEventRequest
  extends AutoValidator
  implements THandlePendingUserEventRequest
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsUUID()
  uuid: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEnum(UserState)
  state: UserState;

  @IsNotEmpty()
  @IsString()
  @MaxLength(25)
  phoneNumber: string;

  constructor(props: THandlePendingUserEventRequest) {
    super(props);
  }
}

export class HandlePendingUserEventController {
  private usecase: HandlePendingUserEventUseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
    userPinAttemptsRepository: UserPinAttemptsRepository,
    userOnboardingRepository: UserOnboardingRepository,
    userSettingRepository: UserSettingRepository,
  ) {
    this.logger = logger.child({
      context: HandlePendingUserEventController.name,
    });
    this.usecase = new HandlePendingUserEventUseCase(
      this.logger,
      userRepository,
      userPinAttemptsRepository,
      userOnboardingRepository,
      userSettingRepository,
    );
  }

  async execute(request: HandlePendingUserEventRequest): Promise<void> {
    this.logger.debug('Handle pending user event request.', { request });

    const { uuid } = request;

    await this.usecase.execute(uuid);

    this.logger.info('Handle pending user event done.');
  }
}
