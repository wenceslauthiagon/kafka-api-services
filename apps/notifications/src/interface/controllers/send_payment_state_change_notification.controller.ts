import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { PaymentEntity, PaymentState } from '@zro/pix-payments/domain';
import { PaymentEvent } from '@zro/pix-payments/application';
import {
  TranslateService,
  BellNotificationEventEmitterControllerInterface,
  BellNotificationEventEmitterController,
  CreateBellNotificationResponse,
} from '@zro/notifications/interface';
import {
  BellNotification,
  BellNotificationRepository,
} from '@zro/notifications/domain';
import {
  CreateBellNotificationUseCase,
  PaymentStateNotFoundException,
  UserService,
} from '@zro/notifications/application';

type UserId = User['uuid'];
type NotificationId = BellNotification['uuid'];

type TSendPaymentStateChangeNotificationRequest = Pick<
  PaymentEvent,
  'id' | 'state' | 'beneficiaryName' | 'value'
> & { userId: UserId; notificationId: NotificationId };

export class SendPaymentStateChangeNotificationRequest
  extends AutoValidator
  implements TSendPaymentStateChangeNotificationRequest
{
  @IsUUID(4)
  notificationId: NotificationId;

  @IsUUID(4)
  id: string;

  @IsEnum(PaymentState)
  state: PaymentState;

  @IsUUID(4)
  userId: UserId;

  @IsString()
  @MaxLength(255)
  beneficiaryName: string;

  @IsInt()
  @IsPositive()
  value: number;

  constructor(props: TSendPaymentStateChangeNotificationRequest) {
    super(props);
  }
}

type TSendPaymentStateChangeNotificationResponse = {
  notificationId: NotificationId;
};

export class SendPaymentStateChangeNotificationResponse
  extends AutoValidator
  implements TSendPaymentStateChangeNotificationResponse
{
  @IsUUID(4)
  notificationId: NotificationId;

  constructor(props: TSendPaymentStateChangeNotificationResponse) {
    super(props);
  }
}

export class SendPaymentStateChangeNotificationController {
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
      context: SendPaymentStateChangeNotificationController.name,
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
    request: SendPaymentStateChangeNotificationRequest,
  ): Promise<CreateBellNotificationResponse> {
    this.logger.debug('Send payment state change notification request.', {
      request,
    });

    const { notificationId, id, userId, beneficiaryName, state, value } =
      request;

    if (!state) {
      throw new PaymentStateNotFoundException({ id });
    }

    const type = `PIXSEND_${state}`;

    const user = new UserEntity({ uuid: userId });

    const payment = new PaymentEntity({
      id,
      state,
      beneficiaryName,
      value,
      user,
    });

    const uuid = notificationId;

    const { message: description, title } =
      await this.translateService.translatePixPaymentState(payment);

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
