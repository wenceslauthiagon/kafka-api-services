import { Logger } from 'winston';
import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { HandleFailedNotifyRegisterBankingTedTopazioEventUseCase as UseCase } from '@zro/api-topazio/application';
import {
  NotifyRegisterBankingTed,
  NotifyRegisterBankingTedEntity,
  NotifyRegisterBankingTedRepository,
  NotifyRegisterBankingTedStatus,
} from '@zro/api-topazio/domain';
import {
  NotifyRegisterBankingTedEventEmitterControllerInterface,
  NotifyRegisterBankingTedEventEmitterController,
} from '@zro/api-topazio/interface';

type THandleFailedNotifyRegisterBankingTedEventRequest = Pick<
  NotifyRegisterBankingTed,
  'transactionId' | 'status' | 'code' | 'message'
>;

export class HandleFailedNotifyRegisterBankingTedEventRequest
  extends AutoValidator
  implements THandleFailedNotifyRegisterBankingTedEventRequest
{
  @IsUUID(4)
  transactionId: string;

  @IsEnum(NotifyRegisterBankingTedStatus)
  status: NotifyRegisterBankingTedStatus;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  message?: string;

  constructor(props: THandleFailedNotifyRegisterBankingTedEventRequest) {
    super(props);
  }
}

export class HandleFailedNotifyRegisterBankingTedTopazioEventController {
  /**
   * Handler triggered to create notify register.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(
    private logger: Logger,
    notifyRegisterRepository: NotifyRegisterBankingTedRepository,
    eventEmitter: NotifyRegisterBankingTedEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyRegisterBankingTedTopazioEventController.name,
    });

    const controllerEventEmitter =
      new NotifyRegisterBankingTedEventEmitterController(eventEmitter);

    this.usecase = new UseCase(
      this.logger,
      notifyRegisterRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleFailedNotifyRegisterBankingTedEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle failed register banking ted event request.', {
      request,
    });

    const notifyRegister = new NotifyRegisterBankingTedEntity(request);
    await this.usecase.execute(notifyRegister);
  }
}
