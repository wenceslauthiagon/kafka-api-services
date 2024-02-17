import { Logger } from 'winston';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AutoValidator, IsMobilePhone } from '@zro/common';
import { Sms, SmsRepository, SmsState } from '@zro/notifications/domain';
import {
  HandleSmsCreatedUseCase,
  SmsGateway,
} from '@zro/notifications/application';
import {
  SmsEvent,
  SmsEventEmitterController,
  SmsEventEmitterControllerImpl,
} from '@zro/notifications/interface';

type THandleSmsCreatedRequest = SmsEvent;

/**
 * SMS request DTO used to class validation.
 */
export class HandleSmsCreatedRequest
  extends AutoValidator
  implements THandleSmsCreatedRequest
{
  @IsUUID(4)
  id: string;

  @IsMobilePhone()
  phoneNumber: string;

  @IsEnum(SmsState)
  state: SmsState;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsUUID(4)
  issuedBy?: string;

  constructor(props: THandleSmsCreatedRequest) {
    super(props);
  }
}

export type THandleSmsCreatedResponse = Pick<
  Sms,
  'id' | 'phoneNumber' | 'state'
>;

export class HandleSmsCreatedResponse
  extends AutoValidator
  implements THandleSmsCreatedResponse
{
  @IsUUID()
  id: string;

  @IsMobilePhone()
  phoneNumber: string;

  @IsEnum(SmsState)
  state: SmsState;

  constructor(props: THandleSmsCreatedResponse) {
    super(props);
  }
}

export class HandleSmsCreatedController {
  /**
   * Local logger instance.
   */
  private logger: Logger;

  /**
   * Send SMS use case.
   */
  private usecase: HandleSmsCreatedUseCase;

  /**
   * SMS event used by use case.
   */
  private smsEventEmitter: SmsEventEmitterControllerImpl;

  /**
   * Default constructor.
   * @param logger System logger.
   * @param smsRepository SMS repository.
   * @param smsEventEmitter SMS event emitter.
   * @param smsGateway Sms gateway.
   * @param logger Global logger.
   */
  constructor(
    private readonly smsRepository: SmsRepository,
    private readonly smsEventEmitterController: SmsEventEmitterController,
    private readonly smsGateway: SmsGateway,
    logger: Logger,
  ) {
    this.logger = logger.child({ context: HandleSmsCreatedController.name });

    this.smsEventEmitter = new SmsEventEmitterControllerImpl(
      this.smsEventEmitterController,
    );

    this.usecase = new HandleSmsCreatedUseCase(
      this.smsRepository,
      this.smsEventEmitter,
      this.smsGateway,
      this.logger,
    );
  }

  /**
   * Send created SMS via SMTP.
   * @param id SMS ID.
   * @returns Sent SMS.
   */
  async execute(
    request: HandleSmsCreatedRequest,
  ): Promise<HandleSmsCreatedResponse> {
    // Send SMS via SMTP.
    const sms = await this.usecase.execute(request.id);

    if (!sms) return null;

    const response: HandleSmsCreatedResponse = {
      id: sms.id,
      phoneNumber: sms.phoneNumber,
      state: sms.state,
    };

    return response;
  }
}
