import { Logger } from 'winston';
import { IsEnum, IsInt, IsPositive, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  PixDevolutionReceivedEntity,
  PixDevolutionReceivedState,
} from '@zro/pix-payments/domain';
import {
  BellNotification,
  BellNotificationRepository,
} from '@zro/notifications/domain';
import {
  CreateBellNotificationUseCase,
  UserService,
  PixDevolutionReceivedStateNotFoundException,
} from '@zro/notifications/application';
import { PixDevolutionReceivedEvent } from '@zro/pix-payments/application';
import {
  TranslateService,
  BellNotificationEventEmitterControllerInterface,
  BellNotificationEventEmitterController,
  CreateBellNotificationResponse,
} from '@zro/notifications/interface';

type UserId = User['uuid'];
type NotificationId = BellNotification['uuid'];

type TReceivePixDevolutionStateChangeNotificationRequest = Pick<
  PixDevolutionReceivedEvent,
  'id' | 'state' | 'amount'
> & { userId: UserId; notificationId: NotificationId };

export class ReceivePixDevolutionStateChangeNotificationRequest
  extends AutoValidator
  implements TReceivePixDevolutionStateChangeNotificationRequest
{
  @IsUUID(4)
  notificationId: NotificationId;

  @IsUUID(4)
  id: string;

  @IsEnum(PixDevolutionReceivedState)
  state: PixDevolutionReceivedState;

  @IsUUID(4)
  userId: UserId;

  @IsInt()
  @IsPositive()
  amount: number;

  constructor(props: TReceivePixDevolutionStateChangeNotificationRequest) {
    super(props);
  }
}

type TReceivePixDevolutionStateChangeNotificationResponse = {
  notificationId: NotificationId;
};

export class ReceivePixDevolutionStateChangeNotificationResponse
  extends AutoValidator
  implements TReceivePixDevolutionStateChangeNotificationResponse
{
  @IsUUID(4)
  notificationId: NotificationId;

  constructor(props: TReceivePixDevolutionStateChangeNotificationResponse) {
    super(props);
  }
}

export class ReceivePixDevolutionStateChangeNotificationController {
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
      context: ReceivePixDevolutionStateChangeNotificationController.name,
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
    request: ReceivePixDevolutionStateChangeNotificationRequest,
  ): Promise<CreateBellNotificationResponse> {
    this.logger.debug(
      'Receive Pix Devolution state change notification request.',
      {
        request,
      },
    );

    const { notificationId, id, userId, amount, state } = request;

    if (!state) {
      throw new PixDevolutionReceivedStateNotFoundException({ id });
    }

    const type = `PIXDEVREC_${state}`;

    const user = new UserEntity({ uuid: userId });

    const pixDevolutionReceived = new PixDevolutionReceivedEntity({
      id,
      state,
      amount,
      user,
    });

    const uuid = notificationId;

    const { message: description, title } =
      await this.translateService.translatePixDevolutionReceivedState(
        pixDevolutionReceived,
      );

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
