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
import {
  WarningPixDepositEntity,
  WarningPixDepositState,
} from '@zro/pix-payments/domain';
import { WarningPixDepositEvent } from '@zro/pix-payments/application';
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
  UserService,
} from '@zro/notifications/application';

type UserId = User['uuid'];
type NotificationId = BellNotification['uuid'];

type TSendWarningPixDepositStateChangeNotificationRequest = Pick<
  WarningPixDepositEvent,
  'id' | 'state'
> & {
  userId: UserId;
  amount: number;
  thirdPartName: string;
  notificationId: NotificationId;
};

export class SendWarningPixDepositStateChangeNotificationRequest
  extends AutoValidator
  implements TSendWarningPixDepositStateChangeNotificationRequest
{
  @IsUUID(4)
  notificationId: NotificationId;

  @IsUUID(4)
  id: string;

  @IsEnum(WarningPixDepositState)
  state: WarningPixDepositState;

  @IsUUID(4)
  userId: UserId;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  @MaxLength(255)
  thirdPartName: string;

  constructor(props: TSendWarningPixDepositStateChangeNotificationRequest) {
    super(props);
  }
}

type TSendWarningPixDepositStateChangeNotificationResponse = {
  notificationId: NotificationId;
};

export class SendWarningPixDepositStateChangeNotificationResponse
  extends AutoValidator
  implements TSendWarningPixDepositStateChangeNotificationResponse
{
  @IsUUID(4)
  notificationId: NotificationId;

  constructor(props: TSendWarningPixDepositStateChangeNotificationResponse) {
    super(props);
  }
}

export class SendWarningPixDepositStateChangeNotificationController {
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
      context: SendWarningPixDepositStateChangeNotificationController.name,
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
    request: SendWarningPixDepositStateChangeNotificationRequest,
  ): Promise<CreateBellNotificationResponse> {
    this.logger.debug('Send Pix Deposit state change notification request.', {
      request,
    });

    const { notificationId, id, userId, state, amount, thirdPartName } =
      request;

    const type = `WARNINGPIXREC_${state}`;

    const user = new UserEntity({ uuid: userId });

    const warningpixDeposit = new WarningPixDepositEntity({
      id,
      state,
      user,
    });

    const uuid = notificationId;

    const { message: description, title } =
      await this.translateService.translateWarningPixDepositState(
        warningpixDeposit,
        amount,
        thirdPartName,
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
