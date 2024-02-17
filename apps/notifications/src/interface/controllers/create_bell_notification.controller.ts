import { Logger } from 'winston';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  BellNotification,
  BellNotificationRepository,
} from '@zro/notifications/domain';
import {
  CreateBellNotificationUseCase,
  UserService,
} from '@zro/notifications/application';
import {
  BellNotificationEventEmitterController,
  BellNotificationEventEmitterControllerInterface,
} from '@zro/notifications/interface';

type UserId = User['uuid'];

type TCreateBellNotificationRequest = Pick<
  BellNotification,
  'uuid' | 'title' | 'type' | 'description'
> & { userId: UserId };

export class CreateBellNotificationRequest
  extends AutoValidator
  implements TCreateBellNotificationRequest
{
  @IsUUID(4)
  uuid: string;

  @IsUUID(4)
  userId: UserId;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @MaxLength(255)
  type: string;

  @IsString()
  @MaxLength(350)
  description: string;

  constructor(props: TCreateBellNotificationRequest) {
    super(props);
  }
}

type TCreateBellNotificationResponse = Pick<BellNotification, 'uuid' | 'read'>;

export class CreateBellNotificationResponse
  extends AutoValidator
  implements TCreateBellNotificationResponse
{
  @IsUUID(4)
  uuid: string;

  @IsBoolean()
  @IsOptional()
  read?: boolean;

  constructor(props: TCreateBellNotificationResponse) {
    super(props);
  }
}

export class CreateBellNotificationController {
  /**
   * Create bell notification use case.
   */
  private usecase: CreateBellNotificationUseCase;

  /**
   * Default constructor.
   * @param logger System logger.
   * @param bellNotificationRepository Bell nofification repository.
   * @param bellNotificationEventEmitterController Bell nofification event emitter.
   * @param userService User service.
   */
  constructor(
    private logger: Logger,
    bellNotificationRepository: BellNotificationRepository,
    bellNotificationEventEmitterController: BellNotificationEventEmitterControllerInterface,
    userService: UserService,
  ) {
    this.logger = logger.child({
      context: CreateBellNotificationController.name,
    });

    const bellNotificationEventEmitter =
      new BellNotificationEventEmitterController(
        bellNotificationEventEmitterController,
      );

    this.usecase = new CreateBellNotificationUseCase(
      this.logger,
      bellNotificationRepository,
      bellNotificationEventEmitter,
      userService,
    );
  }

  async execute(
    request: CreateBellNotificationRequest,
  ): Promise<CreateBellNotificationResponse> {
    this.logger.debug('Create bell notification request.', { request });

    const { uuid, userId, title, type, description } = request;

    const user = new UserEntity({ uuid: userId });

    const bellNotification = await this.usecase.execute(
      uuid,
      user,
      title,
      description,
      type,
    );

    if (!bellNotification) return null;

    const response = new CreateBellNotificationResponse({
      uuid: bellNotification.uuid,
      read: bellNotification.read,
    });

    this.logger.debug('Create bell notification response.', {
      bellNotification: response,
    });

    return response;
  }
}
