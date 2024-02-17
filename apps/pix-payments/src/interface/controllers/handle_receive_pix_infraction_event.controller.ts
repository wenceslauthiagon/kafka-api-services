import { Logger } from 'winston';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  PixInfraction,
  PixInfractionRepository,
  PixInfractionStatus,
  PixInfractionType,
  PixInfractionReport,
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixInfractionRefundOperationRepository,
} from '@zro/pix-payments/domain';
import {
  HandleReceivePixInfractionEventUseCase as UseCase,
  OperationService,
} from '@zro/pix-payments/application';
import {
  PixInfractionEventEmitterController,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type THandleReceivePixInfractionEventRequest = Pick<
  PixInfraction,
  | 'id'
  | 'infractionPspId'
  | 'infractionType'
  | 'status'
  | 'ispbDebitedParticipant'
  | 'ispbCreditedParticipant'
  | 'reportBy'
  | 'ispb'
  | 'endToEndId'
  | 'creationDate'
  | 'lastChangeDate'
  | 'analysisDetails'
  | 'isReporter'
> & { operationTransactionId?: string; reportDetails?: string };

export class HandleReceivePixInfractionEventRequest
  extends AutoValidator
  implements THandleReceivePixInfractionEventRequest
{
  @IsUUID(4)
  id!: string;

  @IsOptional()
  @IsUUID(4)
  operationTransactionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reportDetails?: string;

  @IsUUID(4)
  infractionPspId: string;

  @IsEnum(PixInfractionType)
  infractionType: PixInfractionType;

  @IsEnum(PixInfractionStatus)
  status: PixInfractionStatus;

  @IsString()
  @Length(8, 8)
  ispbDebitedParticipant: string;

  @IsString()
  @Length(8, 8)
  ispbCreditedParticipant: string;

  @IsEnum(PixInfractionReport)
  reportBy: PixInfractionReport;

  @IsString()
  @Length(8, 8)
  ispb: string;

  @IsString()
  endToEndId: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format creationDate',
  })
  creationDate: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format lastChangeDate',
  })
  lastChangeDate: Date;

  @IsBoolean()
  isReporter: boolean;

  constructor(props: THandleReceivePixInfractionEventRequest) {
    super(props);
  }
}

export class HandleReceivePixInfractionEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    infractionRepository: PixInfractionRepository,
    depositRepository: PixDepositRepository,
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    infractionEventEmitter: PixInfractionEventEmitterControllerInterface,
    operationService: OperationService,
    pixPaymentOperationCurrencyTag: string,
    pixPaymentOperationRefundTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: HandleReceivePixInfractionEventController.name,
    });

    const controllerEventEmitter = new PixInfractionEventEmitterController(
      infractionEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      infractionRepository,
      depositRepository,
      devolutionReceivedRepository,
      pixInfractionRefundOperationRepository,
      controllerEventEmitter,
      operationService,
      pixPaymentOperationCurrencyTag,
      pixPaymentOperationRefundTransactionTag,
    );
  }

  async execute(
    request: HandleReceivePixInfractionEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle receive pix infraction event request.', {
      request,
    });

    const {
      id,
      creationDate,
      reportDetails,
      endToEndId,
      infractionPspId,
      operationTransactionId,
      infractionType,
      isReporter,
      ispb,
      ispbCreditedParticipant,
      ispbDebitedParticipant,
      lastChangeDate,
      reportBy,
      status,
    } = request;

    await this.usecase.execute(
      id,
      creationDate,
      reportDetails,
      endToEndId,
      infractionPspId,
      infractionType,
      isReporter,
      ispb,
      ispbCreditedParticipant,
      ispbDebitedParticipant,
      lastChangeDate,
      reportBy,
      status,
      operationTransactionId,
    );

    this.logger.info('Handle receive pix infraction event finished.');
  }
}
