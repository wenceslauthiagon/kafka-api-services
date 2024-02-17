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
import { PixDepositEntity, PixDepositState } from '@zro/pix-payments/domain';
import {
  BellNotification,
  BellNotificationRepository,
} from '@zro/notifications/domain';
import {
  CreateBellNotificationUseCase,
  PixDepositStateNotFoundException,
  UserService,
} from '@zro/notifications/application';
import { PixDepositEvent } from '@zro/pix-payments/application';
import {
  TranslateService,
  BellNotificationEventEmitterControllerInterface,
  BellNotificationEventEmitterController,
  CreateBellNotificationResponse,
} from '@zro/notifications/interface';

type UserId = User['uuid'];
type NotificationId = BellNotification['uuid'];

type TSendPixDepositStateChangeNotificationRequest = Pick<
  PixDepositEvent,
  'id' | 'state' | 'amount' | 'thirdPartName'
> & { userId: UserId; notificationId: NotificationId };

export class SendPixDepositStateChangeNotificationRequest
  extends AutoValidator
  implements TSendPixDepositStateChangeNotificationRequest
{
  @IsUUID(4)
  notificationId: NotificationId;

  @IsUUID(4)
  id: string;

  @IsEnum(PixDepositState)
  state: PixDepositState;

  @IsUUID(4)
  userId: UserId;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  @MaxLength(255)
  thirdPartName: string;

  constructor(props: TSendPixDepositStateChangeNotificationRequest) {
    super(props);
  }
}

type TSendPixDepositStateChangeNotificationResponse = {
  notificationId: NotificationId;
};

export class SendPixDepositStateChangeNotificationResponse
  extends AutoValidator
  implements TSendPixDepositStateChangeNotificationResponse
{
  @IsUUID(4)
  notificationId: NotificationId;

  constructor(props: TSendPixDepositStateChangeNotificationResponse) {
    super(props);
  }
}

export class SendPixDepositStateChangeNotificationController {
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
      context: SendPixDepositStateChangeNotificationController.name,
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
    request: SendPixDepositStateChangeNotificationRequest,
  ): Promise<CreateBellNotificationResponse> {
    this.logger.debug('Send Pix Deposit state change notification request.', {
      request,
    });

    const { notificationId, id, userId, state, amount, thirdPartName } =
      request;

    if (!state) {
      throw new PixDepositStateNotFoundException({ id });
    }

    const type = `PIXREC_${state}`;

    const user = new UserEntity({ uuid: userId });

    const pixDeposit = new PixDepositEntity({
      id,
      state,
      amount,
      thirdPartName,
      user,
    });

    const uuid = notificationId;

    const { message: description, title } =
      await this.translateService.translatePixDepositState(pixDeposit);

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
