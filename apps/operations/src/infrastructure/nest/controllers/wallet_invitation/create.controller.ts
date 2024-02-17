import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  MissingEnvVarException,
  RepositoryParam,
} from '@zro/common';
import {
  WalletInvitationRepository,
  WalletRepository,
} from '@zro/operations/domain';
import { NotificationService, UserService } from '@zro/operations/application';
import {
  KAFKA_TOPICS,
  WalletDatabaseRepository,
  WalletInvitationDatabaseRepository,
  NotificationServiceKafka,
  UserServiceKafka,
} from '@zro/operations/infrastructure';
import {
  CreateWalletInvitationController,
  CreateWalletInvitationRequest,
  CreateWalletInvitationResponse,
} from '@zro/operations/interface';

export type CreateWalletInvitationKafkaRequest =
  KafkaMessage<CreateWalletInvitationRequest>;

export type CreateWalletInvitationKafkaResponse =
  KafkaResponse<CreateWalletInvitationResponse>;

export interface CreateWalletInvitationConfig {
  APP_OPERATION_EXPIRED_INVITE_H: number;
  APP_NOTIFICATION_EMAIL_INVITE_TAG: string;
  APP_NOTIFICATION_EMAIL_URL_INVITE: string;
  APP_NOTIFICATION_EMAIL_INVITE_FROM: string;
  APP_OPERATION_PERMISSION_TYPE_ROOT_TAG: string;
}

@Controller()
@MicroserviceController()
export class CreateWalletInvitationMicroserviceController {
  private readonly expiredInviteH: number;
  private readonly emailInviteTag: string;
  private readonly emailInviteUrl: string;
  private readonly emailInviteFrom: string;
  private readonly permissionTypeRootTag: string;

  /**
   * Default operations RPC controller constructor.
   */
  constructor(
    private configService: ConfigService<CreateWalletInvitationConfig>,
  ) {
    this.expiredInviteH = Number(
      this.configService.get<number>('APP_OPERATION_EXPIRED_INVITE_H'),
    );
    this.emailInviteTag = this.configService.get<string>(
      'APP_NOTIFICATION_EMAIL_INVITE_TAG',
    );
    this.emailInviteUrl = this.configService.get<string>(
      'APP_NOTIFICATION_EMAIL_URL_INVITE',
    );
    this.emailInviteFrom = this.configService.get<string>(
      'APP_NOTIFICATION_EMAIL_INVITE_FROM',
    );
    this.permissionTypeRootTag = this.configService.get<string>(
      'APP_OPERATION_PERMISSION_TYPE_ROOT_TAG',
    );

    if (
      !this.expiredInviteH ||
      !this.emailInviteTag ||
      !this.emailInviteUrl ||
      !this.emailInviteFrom ||
      !this.permissionTypeRootTag
    ) {
      throw new MissingEnvVarException([
        ...(!this.expiredInviteH ? ['APP_OPERATION_EXPIRED_INVITE_H'] : []),
        ...(!this.emailInviteTag ? ['APP_NOTIFICATION_EMAIL_INVITE_TAG'] : []),
        ...(!this.emailInviteUrl ? ['APP_NOTIFICATION_EMAIL_URL_INVITE'] : []),
        ...(!this.emailInviteFrom
          ? ['APP_NOTIFICATION_EMAIL_INVITE_FROM']
          : []),
        ...(!this.permissionTypeRootTag
          ? ['APP_OPERATION_PERMISSION_TYPE_ROOT_TAG']
          : []),
      ]);
    }
  }

  /**
   * Parse create wallet invitation message and call
   * create wallet invitation controller.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WALLET_INVITATION.CREATE)
  async execute(
    @RepositoryParam(WalletInvitationDatabaseRepository)
    walletInvitationRepository: WalletInvitationRepository,
    @RepositoryParam(WalletDatabaseRepository)
    walletRepository: WalletRepository,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserService,
    @KafkaServiceParam(NotificationServiceKafka)
    notificationService: NotificationService,
    @LoggerParam(CreateWalletInvitationMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateWalletInvitationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateWalletInvitationKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateWalletInvitationRequest(message);

    logger.info('Create wallet invitation.', { payload });

    // Create controller.
    const controller = new CreateWalletInvitationController(
      logger,
      walletInvitationRepository,
      walletRepository,
      userService,
      notificationService,
      this.expiredInviteH,
      this.emailInviteTag,
      this.emailInviteUrl,
      this.emailInviteFrom,
      this.permissionTypeRootTag,
    );

    // Create wallet invitation.
    const walletInvitation = await controller.execute(payload);

    logger.info('Wallet invitation created.', { walletInvitation });

    return {
      ctx,
      value: walletInvitation,
    };
  }
}
