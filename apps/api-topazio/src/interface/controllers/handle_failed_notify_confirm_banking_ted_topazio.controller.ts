import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { HandleFailedNotifyConfirmBankingTedTopazioEventUseCase as UseCase } from '@zro/api-topazio/application';
import {
  NotifyConfirmBankingTed,
  NotifyConfirmBankingTedEntity,
  NotifyConfirmBankingTedRepository,
} from '@zro/api-topazio/domain';
import {
  NotifyConfirmBankingTedEventEmitterControllerInterface,
  NotifyConfirmBankingTedEventEmitterController,
} from '@zro/api-topazio/interface';
import { AccountType } from '@zro/pix-payments/domain';

type THandleFailedNotifyConfirmBankingTedEventRequest = Pick<
  NotifyConfirmBankingTed,
  | 'transactionId'
  | 'document'
  | 'bankCode'
  | 'branch'
  | 'accountNumber'
  | 'accountType'
  | 'value'
>;

export class HandleFailedNotifyConfirmBankingTedEventRequest
  extends AutoValidator
  implements THandleFailedNotifyConfirmBankingTedEventRequest
{
  @IsUUID(4)
  transactionId: string;

  @IsString()
  @MaxLength(255)
  document: string;

  @IsString()
  @MaxLength(255)
  bankCode: string;

  @IsString()
  @MaxLength(255)
  branch: string;

  @IsString()
  @MaxLength(255)
  accountNumber: string;

  @IsEnum(AccountType)
  accountType: AccountType;

  @IsPositive()
  @IsInt()
  value: number;

  constructor(props: THandleFailedNotifyConfirmBankingTedEventRequest) {
    super(props);
  }
}

export class HandleFailedNotifyConfirmBankingTedTopazioEventController {
  /**
   * Handler triggered to create notify confirm.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(
    private logger: Logger,
    notifyConfirmRepository: NotifyConfirmBankingTedRepository,
    eventEmitter: NotifyConfirmBankingTedEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyConfirmBankingTedTopazioEventController.name,
    });

    const controllerEventEmitter =
      new NotifyConfirmBankingTedEventEmitterController(eventEmitter);

    this.usecase = new UseCase(
      this.logger,
      notifyConfirmRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleFailedNotifyConfirmBankingTedEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle failed confirm banking ted event request.', {
      request,
    });

    const notifyConfirm = new NotifyConfirmBankingTedEntity(request);
    await this.usecase.execute(notifyConfirm);
  }
}
