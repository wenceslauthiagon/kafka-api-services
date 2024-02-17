import { Logger } from 'winston';
import { Signup, SignupEntity, SignupRepository } from '@zro/signup/domain';
import { AutoValidator } from '@zro/common';
import { IsUUID } from 'class-validator';

import {
  SendConfirmCodeSignupUseCase,
  NotificationService,
} from '@zro/signup/application';

type TSendConfirmCodeSignupRequest = Pick<Signup, 'id'>;

export class SendConfirmCodeSignupRequest
  extends AutoValidator
  implements TSendConfirmCodeSignupRequest
{
  @IsUUID()
  id: string;

  constructor(props: TSendConfirmCodeSignupRequest) {
    super(props);
  }
}

export class SendConfirmCodeSignupController {
  private usecase: SendConfirmCodeSignupUseCase;

  constructor(
    private logger: Logger,
    private readonly signupRepository: SignupRepository,
    private readonly notificationService: NotificationService,
    private readonly emailTag: string,
    private readonly emailFrom: string,
  ) {
    this.logger = logger.child({
      context: SendConfirmCodeSignupController.name,
    });

    this.usecase = new SendConfirmCodeSignupUseCase(
      this.logger,
      this.signupRepository,
      this.notificationService,
      this.emailTag,
      this.emailFrom,
    );
  }

  async execute(request: SendConfirmCodeSignupRequest): Promise<void> {
    this.logger.debug('SendConfirmCode signup request.', { request });

    const { id } = request;

    const signup = new SignupEntity({ id });

    await this.usecase.execute(signup);

    this.logger.info('Sent confirm code.');
  }
}
