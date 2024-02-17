import { AutoValidator } from '@zro/common';
import { Logger } from 'winston';
import { IsBoolean, IsString, IsUUID } from 'class-validator';
import {
  HandleBellNotificationCreatedUseCase,
  PushNotificationGateway,
  UserService,
} from '@zro/notifications/application';
import {
  BellNotification,
  BellNotificationRepository,
} from '@zro/notifications/domain';
import {
  BellNotificationEventEmitterController,
  BellNotificationEventEmitterControllerInterface,
} from '@zro/notifications/interface';

export type THandleBellNotificationCreatedEventRequest = Required<
  Pick<BellNotification, 'uuid'>
>;

/**
 * Bell notification request DTO used to class validation.
 */
export class HandleBellNotificationCreatedEventRequest
  extends AutoValidator
  implements THandleBellNotificationCreatedEventRequest
{
  @IsUUID(4)
  uuid: string;

  constructor(props: THandleBellNotificationCreatedEventRequest) {
    super(props);
  }
}

export type THandleBellNotificationCreatedResponse = Pick<
  BellNotification,
  'uuid' | 'title' | 'description' | 'type' | 'read'
>;

export class HandleBellNotificationCreatedResponse
  extends AutoValidator
  implements THandleBellNotificationCreatedResponse
{
  @IsUUID(4)
  uuid: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  type: string;

  @IsBoolean()
  read: boolean;

  constructor(props: THandleBellNotificationCreatedResponse) {
    super(props);
  }
}

export class HandleBellNotificationCreatedController {
  /**
   * Local logger instance.
   */
  private logger: Logger;

  /**
   * Send BellNotification use case.
   */
  private usecase: HandleBellNotificationCreatedUseCase;

  /**
   * BellNotification event used by use case.
   */
  private bellNotificationEventEmitter: BellNotificationEventEmitterControllerInterface;

  /**
   * Default constructor.
   * @param {BellNotificationRepository} bellNotificationRepository Bell notification repository.
   * @param {BellNotificationEventEmitterController} bellNotificationEventEmitterController Bell notification event emitter.
   * @param {PushNotificationGateway} pushNotificationGateway Bell notification gateway.
   * @param {Logger} logger Global logger.
   * @returns HandleBellNotificationCreatedResponse Bell notification handle response.
   */
  constructor(
    private readonly bellNotificationRepository: BellNotificationRepository,
    private readonly bellNotificationEventEmitterController: BellNotificationEventEmitterControllerInterface,
    userService: UserService,
    private readonly pushNotificationGateway: PushNotificationGateway,
    logger: Logger,
  ) {
    this.logger = logger.child({
      context: HandleBellNotificationCreatedController.name,
    });

    const controllerEventEmitter = new BellNotificationEventEmitterController(
      this.bellNotificationEventEmitterController,
    );

    this.usecase = new HandleBellNotificationCreatedUseCase(
      this.bellNotificationRepository,
      controllerEventEmitter,
      this.pushNotificationGateway,
      userService,
      this.logger,
    );
  }

  /**
   * Send created bell notification via FCM.
   * @param {HandleBellNotificationCreatedRequest} request Bell notification request params.
   * @returns {HandleBellNotificationCreatedResponse} Sent BellNotification.
   */
  async execute(
    request: HandleBellNotificationCreatedEventRequest,
  ): Promise<HandleBellNotificationCreatedResponse> {
    // Send bell notification via FCM.
    const bellNotification = await this.usecase.execute(request.uuid);

    if (!bellNotification) return null;

    const response: HandleBellNotificationCreatedResponse = {
      uuid: bellNotification.uuid,
      title: bellNotification.title,
      description: bellNotification.description,
      type: bellNotification.type,
      read: bellNotification.read,
    };

    return response;
  }
}
