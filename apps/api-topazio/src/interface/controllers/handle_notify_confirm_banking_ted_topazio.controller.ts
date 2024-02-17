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
import { HandleNotifyConfirmBankingTedTopazioEventUseCase as UseCase } from '@zro/api-topazio/application';
import {
  NotifyConfirmBankingTed,
  NotifyConfirmBankingTedEntity,
  NotifyConfirmBankingTedRepository,
} from '@zro/api-topazio/domain';
import { AccountType } from '@zro/pix-payments/domain';

type THandleNotifyConfirmBankingTedTopazioEventRequest = Pick<
  NotifyConfirmBankingTed,
  | 'transactionId'
  | 'document'
  | 'bankCode'
  | 'branch'
  | 'accountNumber'
  | 'accountType'
  | 'value'
>;

export class HandleNotifyConfirmBankingTedTopazioEventRequest
  extends AutoValidator
  implements THandleNotifyConfirmBankingTedTopazioEventRequest
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

  constructor(props: THandleNotifyConfirmBankingTedTopazioEventRequest) {
    super(props);
  }
}

export class HandleNotifyConfirmBankingTedTopazioEventController {
  /**
   * Handler triggered to create notify confirm banking ted.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(
    private logger: Logger,
    notifyConfirmBankingTedRepository: NotifyConfirmBankingTedRepository,
  ) {
    this.logger = logger.child({
      context: HandleNotifyConfirmBankingTedTopazioEventController.name,
    });

    this.usecase = new UseCase(this.logger, notifyConfirmBankingTedRepository);
  }

  async execute(
    request: HandleNotifyConfirmBankingTedTopazioEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle create confirm banking ted event request.', {
      request,
    });

    const notifyConfirm = new NotifyConfirmBankingTedEntity(request);
    await this.usecase.execute(notifyConfirm);
  }
}
