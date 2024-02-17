import { Logger } from 'winston';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  Email,
  EmailRepository,
  EmailState,
  EmailTemplate,
  EmailTemplateRepository,
} from '@zro/notifications/domain';
import {
  CreateEmailUseCase,
  EncryptProvider,
} from '@zro/notifications/application';
import {
  EmailEventEmitterControllerImpl,
  EmailEventEmitterController,
} from '@zro/notifications/interface';

type UserId = User['uuid'];
type Tag = EmailTemplate['tag'];
type Data = Record<string, string>;
type TCreateEmailRequest = Pick<Email, 'id' | 'to' | 'from' | 'issuedBy'> & {
  tag: Tag;
  userId?: UserId;
  data?: Data;
};

export class CreateEmailRequest
  extends AutoValidator
  implements TCreateEmailRequest
{
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  to: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  from: string;

  @IsString()
  @MaxLength(255)
  tag: Tag; // para buscar o template

  @IsUUID()
  @IsOptional()
  userId?: UserId;

  @IsObject()
  @IsOptional()
  data?: Data;

  @IsUUID()
  @IsOptional()
  issuedBy?: string;

  constructor(props: CreateEmailRequest) {
    super(props);
  }
}

type TCreateEmailResponse = Pick<Email, 'id' | 'to' | 'from' | 'state'>;

export class CreateEmailResponse
  extends AutoValidator
  implements TCreateEmailResponse
{
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  to: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  from: string;

  @IsEnum(EmailState)
  state: EmailState;

  constructor(props: CreateEmailResponse) {
    super(props);
  }
}

export class CreateEmailController {
  /**
   * Send e-mail use case.
   */
  private usecase: CreateEmailUseCase;

  /**
   * Default constructor.
   * @param logger System logger.
   * @param emailRepository E-mail repository.
   * @param emailTemplateRepository Template repository.
   * @param emailEventEmitterController E-mail event emitter.
   */
  constructor(
    private logger: Logger,
    emailRepository: EmailRepository,
    emailTemplateRepository: EmailTemplateRepository,
    emailEventEmitterController: EmailEventEmitterController,
    encryptProvider: EncryptProvider,
  ) {
    this.logger = logger.child({ context: CreateEmailController.name });

    const emailEventEmitter = new EmailEventEmitterControllerImpl(
      emailEventEmitterController,
    );

    this.usecase = new CreateEmailUseCase(
      emailRepository,
      emailTemplateRepository,
      emailEventEmitter,
      encryptProvider,
      this.logger,
    );
  }

  /**
   * Create and schedule e-mail.
   *
   * @param request Send e-mail request.
   * @returns E-mail created info.
   */
  async execute(request: CreateEmailRequest): Promise<CreateEmailResponse> {
    this.logger.debug('Send e-mail request.', request);

    const { id, to, from, tag, data, userId, issuedBy } = request;

    const user = userId && new UserEntity({ uuid: userId });

    const email = await this.usecase.execute(
      id,
      to,
      from,
      tag,
      data,
      user,
      issuedBy,
    );

    this.logger.debug('Created e-mail.', { email });

    const response = new CreateEmailResponse({
      id: email.id,
      to: email.to,
      from: email.from,
      state: email.state,
    });

    return response;
  }
}
