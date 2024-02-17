import { Logger } from 'winston';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsMobilePhone } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  Sms,
  SmsRepository,
  SmsState,
  SmsTemplate,
  SmsTemplateRepository,
} from '@zro/notifications/domain';
import {
  CreateSmsUseCase,
  EncryptProvider,
} from '@zro/notifications/application';
import {
  SmsEventEmitterControllerImpl,
  SmsEventEmitterController,
} from '@zro/notifications/interface';

type UserId = User['uuid'];
type Tag = SmsTemplate['tag'];
type Data = Record<string, string>;
type TCreateSmsRequest = Pick<Sms, 'id' | 'phoneNumber' | 'issuedBy'> & {
  tag: Tag;
  userId?: UserId;
  data?: Data;
};

export class CreateSmsRequest
  extends AutoValidator
  implements TCreateSmsRequest
{
  @IsUUID()
  id: string;

  @MaxLength(15)
  @IsMobilePhone()
  phoneNumber: string;

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

  constructor(props: CreateSmsRequest) {
    super(props);
  }
}

type TCreateSmsResponse = Pick<Sms, 'id' | 'phoneNumber' | 'state'>;

export class CreateSmsResponse
  extends AutoValidator
  implements TCreateSmsResponse
{
  @IsUUID()
  id: string;

  @IsMobilePhone()
  @MaxLength(15)
  phoneNumber: string;

  @IsEnum(SmsState)
  state: SmsState;

  constructor(props: CreateSmsResponse) {
    super(props);
  }
}

export class CreateSmsController {
  /**
   * Send SMS use case.
   */
  private usecase: CreateSmsUseCase;

  /**
   * Default constructor.
   * @param logger System logger.
   * @param smsRepository SMS repository.
   * @param smsTemplateRepository Template repository.
   * @param smsEventEmitterController SMS event emitter.
   */
  constructor(
    private logger: Logger,
    smsRepository: SmsRepository,
    smsTemplateRepository: SmsTemplateRepository,
    smsEventEmitterController: SmsEventEmitterController,
    encryptProvider: EncryptProvider,
  ) {
    this.logger = logger.child({ context: CreateSmsController.name });

    const smsEventEmitter = new SmsEventEmitterControllerImpl(
      smsEventEmitterController,
    );

    this.usecase = new CreateSmsUseCase(
      smsRepository,
      smsTemplateRepository,
      smsEventEmitter,
      encryptProvider,
      this.logger,
    );
  }

  /**
   * Create and schedule SMS.
   *
   * @param request Send SMS request.
   * @returns SMS created info.
   */
  async execute(request: CreateSmsRequest): Promise<CreateSmsResponse> {
    this.logger.debug('Send SMS request.', request);

    const { id, phoneNumber, tag, data, userId, issuedBy } = request;

    const user = userId && new UserEntity({ uuid: userId });

    const sms = await this.usecase.execute(
      id,
      phoneNumber,
      tag,
      data,
      user,
      issuedBy,
    );

    this.logger.debug('Created SMS.', { sms });

    const response = new CreateSmsResponse({
      id: sms.id,
      phoneNumber: sms.phoneNumber,
      state: sms.state,
    });

    return response;
  }
}
