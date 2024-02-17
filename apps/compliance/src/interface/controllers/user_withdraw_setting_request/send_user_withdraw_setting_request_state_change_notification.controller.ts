import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  UserWithdrawSettingRequestRepository,
  UserWithdrawSettingRequestState,
} from '@zro/compliance/domain';
import {
  UserWithdrawSettingRequestEvent,
  UserWithdrawSettingRequestNotFoundException,
} from '@zro/compliance/application';
import { CreateBellNotificationRequest } from '@zro/notifications/interface';
import {
  NotificationService,
  TranslateService,
} from '@zro/compliance/interface';
import { BellNotification } from '@zro/notifications/domain';

type UserId = User['uuid'];
type NotificationId = BellNotification['uuid'];

type TSendUserWithdrawSettingRequestStateChangeNotificationRequest = Pick<
  UserWithdrawSettingRequestEvent,
  'id' | 'state'
> & {
  userId: UserId;
  notificationId: NotificationId;
};

export class SendUserWithdrawSettingRequestStateChangeNotificationRequest
  extends AutoValidator
  implements TSendUserWithdrawSettingRequestStateChangeNotificationRequest
{
  @IsUUID(4)
  notificationId: NotificationId;

  @IsUUID(4)
  id: string;

  @IsEnum(UserWithdrawSettingRequestState)
  state: UserWithdrawSettingRequestState;

  @IsUUID(4)
  userId: UserId;

  constructor(
    props: TSendUserWithdrawSettingRequestStateChangeNotificationRequest,
  ) {
    super(props);
  }
}

interface TSendUserWithdrawSettingRequestStateChangeNotificationResponse {
  notificationId: NotificationId;
}

export class SendUserWithdrawSettingRequestStateChangeNotificationResponse
  extends AutoValidator
  implements TSendUserWithdrawSettingRequestStateChangeNotificationResponse
{
  @IsUUID(4)
  notificationId: NotificationId;

  constructor(
    props: TSendUserWithdrawSettingRequestStateChangeNotificationResponse,
  ) {
    super(props);
  }
}

export class SendUserWithdrawSettingRequestStateChangeNotificationController {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param userLimitRequestRepository UserWithdrawSettingRequest repository.
   * @param notificationService Notification service.
   */
  constructor(
    private logger: Logger,
    private userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
    private notificationService: NotificationService,
    private translateService: TranslateService,
  ) {
    this.logger = logger.child({
      context:
        SendUserWithdrawSettingRequestStateChangeNotificationController.name,
    });
  }

  async execute(
    request: SendUserWithdrawSettingRequestStateChangeNotificationRequest,
  ): Promise<SendUserWithdrawSettingRequestStateChangeNotificationResponse> {
    this.logger.debug(
      'Send User withdraw setting request state change notification.',
      {
        request,
      },
    );

    const { notificationId, id, userId } = request;

    const userWithdrawSettingRequest =
      await this.userWithdrawSettingRequestRepository.getById(id);

    if (!userWithdrawSettingRequest) {
      throw new UserWithdrawSettingRequestNotFoundException({ id });
    }

    const type = `USERWITHDRAWSETTINGREQUEST_${userWithdrawSettingRequest.state}`;

    const { message: description, title } =
      await this.translateService.translateUserWithdrawSettingRequestState(
        userWithdrawSettingRequest,
      );

    const payload = new CreateBellNotificationRequest({
      uuid: notificationId,
      description,
      title,
      type,
      userId,
    });

    this.logger.debug('Create bell notification.', { payload });

    const response =
      await this.notificationService.createBellNotification(payload);

    this.logger.debug('Bell notification created.', { response });

    const result =
      new SendUserWithdrawSettingRequestStateChangeNotificationResponse({
        notificationId: response.uuid,
      });

    return result;
  }
}
