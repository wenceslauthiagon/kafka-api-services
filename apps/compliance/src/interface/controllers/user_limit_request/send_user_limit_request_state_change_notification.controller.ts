import { Logger } from 'winston';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  UserLimitRequestRepository,
  UserLimitRequestState,
  UserLimitRequestStatus,
} from '@zro/compliance/domain';
import {
  UserLimitRequestEvent,
  UserLimitRequestNotFoundException,
} from '@zro/compliance/application';
import { CreateBellNotificationRequest } from '@zro/notifications/interface';
import {
  NotificationService,
  TranslateService,
} from '@zro/compliance/interface';
import { BellNotification } from '@zro/notifications/domain';

type UserId = User['uuid'];
type NotificationId = BellNotification['uuid'];

type TSendUserLimitRequestStateChangeNotificationRequest = Omit<
  UserLimitRequestEvent,
  'user'
> & { userId: UserId; notificationId: NotificationId };

export class SendUserLimitRequestStateChangeNotificationRequest
  extends AutoValidator
  implements TSendUserLimitRequestStateChangeNotificationRequest
{
  @IsUUID(4)
  notificationId: NotificationId;

  @IsUUID(4)
  id: string;

  @IsOptional()
  @IsEnum(UserLimitRequestStatus)
  status: UserLimitRequestStatus;

  @IsEnum(UserLimitRequestState)
  state: UserLimitRequestState;

  @IsUUID(4)
  userId: UserId;

  constructor(props: TSendUserLimitRequestStateChangeNotificationRequest) {
    super(props);
  }
}

interface TSendUserLimitRequestStateChangeNotificationResponse {
  notificationId: NotificationId;
}

export class SendUserLimitRequestStateChangeNotificationResponse
  extends AutoValidator
  implements TSendUserLimitRequestStateChangeNotificationResponse
{
  @IsUUID(4)
  notificationId: NotificationId;

  constructor(props: TSendUserLimitRequestStateChangeNotificationResponse) {
    super(props);
  }
}

export class SendUserLimitRequestStateChangeNotificationController {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param userLimitRequestRepository UserLimitRequest repository.
   * @param notificationService Notification service.
   */
  constructor(
    private logger: Logger,
    private userLimitRequestRepository: UserLimitRequestRepository,
    private notificationService: NotificationService,
    private translateService: TranslateService,
  ) {
    this.logger = logger.child({
      context: SendUserLimitRequestStateChangeNotificationController.name,
    });
  }

  async execute(
    request: SendUserLimitRequestStateChangeNotificationRequest,
  ): Promise<SendUserLimitRequestStateChangeNotificationResponse> {
    this.logger.debug('Send User Limit Request state change notification.', {
      request,
    });

    const { notificationId, id, userId } = request;

    const userLimitRequest = await this.userLimitRequestRepository.getById(id);

    if (!userLimitRequest) {
      throw new UserLimitRequestNotFoundException({ id });
    }

    const type = `USERLIMITREQUEST_${userLimitRequest.state}`;

    const { message: description, title } =
      await this.translateService.translateUserLimitRequestState(
        userLimitRequest,
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

    const result = new SendUserLimitRequestStateChangeNotificationResponse({
      notificationId: response.uuid,
    });

    return result;
  }
}
