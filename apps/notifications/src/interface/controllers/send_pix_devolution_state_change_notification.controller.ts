import { Logger } from 'winston';
import { IsEnum, IsInt, IsPositive, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  PixDevolutionEntity,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  BellNotification,
  BellNotificationRepository,
} from '@zro/notifications/domain';
import {
  CreateBellNotificationUseCase,
  PixDevolutionStateNotFoundException,
  UserService,
} from '@zro/notifications/application';
import { PixDevolutionEvent } from '@zro/pix-payments/application';
import {
  TranslateService,
  BellNotificationEventEmitterControllerInterface,
  BellNotificationEventEmitterController,
  CreateBellNotificationResponse,
} from '@zro/notifications/interface';

type UserId = User['uuid'];
type NotificationId = BellNotification['uuid'];

type TSendPixDevolutionStateChangeNotificationRequest = Pick<
  PixDevolutionEvent,
  'id' | 'state' | 'amount'
> & { userId: UserId; notificationId: NotificationId };

export class SendPixDevolutionStateChangeNotificationRequest
  extends AutoValidator
  implements TSendPixDevolutionStateChangeNotificationRequest
{
  @IsUUID(4)
  notificationId: NotificationId;

  @IsUUID(4)
  id: string;

  @IsEnum(PixDevolutionState)
  state: PixDevolutionState;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsUUID(4)
  userId: UserId;

  constructor(props: TSendPixDevolutionStateChangeNotificationRequest) {
    super(props);
  }
}

type TSendPixDevolutionStateChangeNotificationResponse = {
  notificationId: NotificationId;
};

export class SendPixDevolutionStateChangeNotificationResponse
  extends AutoValidator
  implements TSendPixDevolutionStateChangeNotificationResponse
{
  @IsUUID(4)
  notificationId: NotificationId;

  constructor(props: TSendPixDevolutionStateChangeNotificationResponse) {
    super(props);
  }
}

export class SendPixDevolutionStateChangeNotificationController {
  /**
   * Create bell notification usecase.
   */
  private usecase: CreateBellNotificationUseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param translateService Translate service.
   * @param bellNotificationRepository Bell nofification repository.
   * @param bellNotificationEventEmitterController Bell nofification event emitter.
   * @param userService User service.
   */
  constructor(
    private logger: Logger,
    private translateService: TranslateService,
    bellNotificationRepository: BellNotificationRepository,
    bellNotificationEventEmitterController: BellNotificationEventEmitterControllerInterface,
    userService: UserService,
  ) {
    this.logger = logger.child({
      context: SendPixDevolutionStateChangeNotificationController.name,
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
    request: SendPixDevolutionStateChangeNotificationRequest,
  ): Promise<CreateBellNotificationResponse> {
    this.logger.debug(
      'Send Pix Devolution state change notification request.',
      { request },
    );

    const { notificationId, id, userId, state, amount } = request;

    if (!state) {
      throw new PixDevolutionStateNotFoundException({ id });
    }

    const type = `PIXDEVSEND_${state}`;

    const user = new UserEntity({ uuid: userId });

    const pixDevolution = new PixDevolutionEntity({
      id,
      state,
      amount,
      user,
    });

    const uuid = notificationId;

    const { message: description, title } =
      await this.translateService.translatePixDevolutionState(pixDevolution);

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
