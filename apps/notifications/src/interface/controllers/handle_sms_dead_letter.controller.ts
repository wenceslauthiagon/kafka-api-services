import { Logger } from 'winston';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AutoValidator, IsMobilePhone } from '@zro/common';
import { Sms, SmsRepository, SmsState } from '@zro/notifications/domain';
import { HandleSmsDeadLetterUseCase } from '@zro/notifications/application';
import {
  SmsEvent,
  SmsEventEmitterController,
  SmsEventEmitterControllerImpl,
} from '../events/sms.emitter';

type THandleCreatedSmsDeadLetter = SmsEvent;

export class HandleCreatedSmsDeadLetterRequest
  extends AutoValidator
  implements THandleCreatedSmsDeadLetter
{
  @IsUUID()
  id: string;

  @IsMobilePhone()
  phoneNumber: string;

  @IsEnum(SmsState)
  state: SmsState;

  @IsOptional()
  @IsString()
  body?: string;

  constructor(props: THandleCreatedSmsDeadLetter) {
    super(props);
  }
}

export type THandleCreatedSmsDeadLetterResponse = Pick<
  Sms,
  'id' | 'phoneNumber' | 'state'
>;

export class HandleCreatedSmsDeadLetterResponse
  extends AutoValidator
  implements THandleCreatedSmsDeadLetterResponse
{
  @IsUUID()
  id: string;

  @IsMobilePhone()
  phoneNumber: string;

  @IsEnum(SmsState)
  state: SmsState;

  constructor(props: THandleCreatedSmsDeadLetterResponse) {
    super(props);
  }
}

export class HandleCreatedSmsDeadLetterController {
  /**
   * Local logger instance.
   */
  private logger: Logger;

  /**
   * Handle SMS dead letter use case.
   */
  private usecase: HandleSmsDeadLetterUseCase;

  /**
   * SMS event used by use case.
   */
  private smsEventEmitter: SmsEventEmitterControllerImpl;

  /**
   * Default constructor.
   * @param logger System logger.
   * @param smsRepository SMS repository.
   * @param smsEventEmitter SMS event emitter.
   * @param logger Global logger.
   */
  constructor(
    private readonly smsRepository: SmsRepository,
    private readonly smsEventEmitterController: SmsEventEmitterController,
    logger: Logger,
  ) {
    this.logger = logger.child({
      context: HandleCreatedSmsDeadLetterController.name,
    });

    this.smsEventEmitter = new SmsEventEmitterControllerImpl(
      this.smsEventEmitterController,
    );

    this.usecase = new HandleSmsDeadLetterUseCase(
      this.smsRepository,
      this.smsEventEmitter,
      this.logger,
    );
  }

  /**
   * Fail SMS.
   * @param id SMS ID.
   * @returns Failed SMS.
   */
  async execute(
    request: HandleCreatedSmsDeadLetterRequest,
  ): Promise<HandleCreatedSmsDeadLetterResponse> {
    // Send SMS via SMTP.
    const sms = await this.usecase.execute(request.id);

    if (!sms) return null;

    const response = new HandleCreatedSmsDeadLetterResponse({
      id: sms.id,
      phoneNumber: sms.phoneNumber,
      state: sms.state,
    });

    return response;
  }
}
