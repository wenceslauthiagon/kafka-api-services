import { Logger } from 'winston';
import {
  IsBoolean,
  IsEnum,
  IsString,
  IsUUID,
  IsPositive,
  IsOptional,
  MaxLength,
  Length,
  IsInt,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { AccountType } from '@zro/pix-payments/domain';
import {
  StatusType,
  NotifyCompletion,
  NotifyCompletionEntity,
  NotifyCompletionRepository,
} from '@zro/api-topazio/domain';
import {
  HandleNotifyCompletionTopazioEventUseCase as UseCase,
  PixPaymentService,
} from '@zro/api-topazio/application';
import {
  PixPaymentEventEmitterControllerInterface,
  PixPaymentEventEmitterController,
  PixDevolutionEventEmitterControllerInterface,
  PixDevolutionEventEmitterController,
} from '@zro/api-topazio/interface';

type THandleNotifyCompletionTopazioEventRequest = Pick<
  NotifyCompletion,
  | 'transactionId'
  | 'isDevolution'
  | 'status'
  | 'txId'
  | 'amount'
  | 'clientIspb'
  | 'clientBranch'
  | 'clientAccountNumber'
  | 'clientDocument'
  | 'clientName'
  | 'clientKey'
  | 'thirdPartIspb'
  | 'thirdPartBranch'
  | 'thirdPartAccountType'
  | 'thirdPartAccountNumber'
  | 'thirdPartDocument'
  | 'thirdPartName'
  | 'thirdPartKey'
  | 'endToEndId'
  | 'description'
>;

export class HandleNotifyCompletionTopazioEventRequest
  extends AutoValidator
  implements THandleNotifyCompletionTopazioEventRequest
{
  @IsUUID(4)
  transactionId: string;

  @IsBoolean()
  isDevolution: boolean;

  @IsEnum(StatusType)
  status: StatusType;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  txId?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  @Length(8, 8)
  clientIspb?: string;

  @IsString()
  @IsOptional()
  @Length(4, 4)
  clientBranch?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  clientAccountNumber?: string;

  @IsString()
  @IsOptional()
  @Length(11, 14)
  clientDocument?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  clientName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(77)
  clientKey?: string;

  @IsString()
  @IsOptional()
  @Length(8, 8)
  thirdPartIspb?: string;

  @IsString()
  @IsOptional()
  @Length(4, 4)
  thirdPartBranch?: string;

  @IsOptional()
  @IsEnum(AccountType)
  thirdPartAccountType?: AccountType;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartAccountNumber?: string;

  @IsString()
  @IsOptional()
  @Length(11, 14)
  thirdPartDocument?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(77)
  thirdPartKey?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  endToEndId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(140)
  description?: string;

  constructor(props: THandleNotifyCompletionTopazioEventRequest) {
    super(props);
  }
}

export class HandleNotifyCompletionTopazioEventController {
  /**
   * Handler triggered to create notify completion.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(
    private logger: Logger,
    notifyCompletionRepository: NotifyCompletionRepository,
    pixPaymentService: PixPaymentService,
    pixPaymentEventEmitter: PixPaymentEventEmitterControllerInterface,
    pixDevolutionEventEmitter: PixDevolutionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleNotifyCompletionTopazioEventController.name,
    });
    const pixPaymentEmitter = new PixPaymentEventEmitterController(
      pixPaymentEventEmitter,
    );
    const pixDevolutionEmitter = new PixDevolutionEventEmitterController(
      pixDevolutionEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      notifyCompletionRepository,
      pixPaymentService,
      pixPaymentEmitter,
      pixDevolutionEmitter,
    );
  }

  async execute(
    request: HandleNotifyCompletionTopazioEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle create completion event request.', { request });

    const notifyCompletion = new NotifyCompletionEntity(request);
    await this.usecase.execute(notifyCompletion);
  }
}
