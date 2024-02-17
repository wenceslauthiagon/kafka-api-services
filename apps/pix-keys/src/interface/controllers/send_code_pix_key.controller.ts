import { Logger } from 'winston';
import { UserEntity } from '@zro/users/domain';
import {
  PixKeyRepository,
  PixKeyVerificationRepository,
} from '@zro/pix-keys/domain';
import {
  NotificationService,
  SendCodePixKeyUseCase,
} from '@zro/pix-keys/application';

export interface SendCodePixKeyRequest {
  userId: string;
  id: string;
}

export class SendCodePixKeyController {
  private usecase: SendCodePixKeyUseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    pixKeyVerificationRepository: PixKeyVerificationRepository,
    notificationService: NotificationService,
    emailTag: string,
    emailFrom: string,
    smsTag: string,
  ) {
    this.logger = logger.child({
      context: SendCodePixKeyController.name,
    });
    this.usecase = new SendCodePixKeyUseCase(
      this.logger,
      pixKeyRepository,
      pixKeyVerificationRepository,
      notificationService,
      emailTag,
      emailFrom,
      smsTag,
    );
  }

  async execute(request: SendCodePixKeyRequest): Promise<void> {
    this.logger.debug('Send pixKey verification code.', { request });

    const { userId, id } = request;

    const user = new UserEntity({ uuid: userId });

    await this.usecase.execute(user, id);
  }
}
