import { Logger } from 'winston';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixRefund,
  PixRefundTransaction,
  PixRefundRepository,
  PixRefundStatus,
  PixInfraction,
  PixRefundReason,
  PixInfractionRepository,
  PixDevolutionReceivedRepository,
  PixDepositRepository,
  PixInfractionRefundOperationRepository,
} from '@zro/pix-payments/domain';
import {
  OperationService,
  HandleReceivePixRefundEventUseCase as UseCase,
} from '@zro/pix-payments/application';
import {
  PixRefundEventEmitterController,
  PixRefundEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { Bank, BankEntity } from '@zro/banking/domain';

type InfractionId = PixInfraction['infractionPspId'];
type BankIspb = Bank['ispb'];

type THandleReceivePixRefundEventRequest = Pick<
  PixRefund,
  | 'id'
  | 'contested'
  | 'amount'
  | 'description'
  | 'reason'
  | 'status'
  | 'solicitationPspId'
> & {
  endToEndIdTransaction: string;
  infractionId?: string;
  requesterIspb?: BankIspb;
  responderIspb?: BankIspb;
};

export class HandleReceivePixRefundEventRequest
  extends AutoValidator
  implements THandleReceivePixRefundEventRequest
{
  @IsUUID(4)
  id!: string;

  @IsUUID(4)
  solicitationPspId: string;

  @IsBoolean()
  @IsOptional()
  contested?: boolean;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  @MaxLength(1900)
  @IsOptional()
  description?: string;

  @IsEnum(PixRefundReason)
  @IsOptional()
  reason?: PixRefundReason;

  @IsString()
  @Length(8, 8)
  @IsOptional()
  requesterIspb?: BankIspb;

  @IsString()
  @Length(8, 8)
  @IsOptional()
  responderIspb?: BankIspb;

  @IsEnum(PixRefundStatus)
  status: PixRefundStatus;

  @IsString()
  @MaxLength(255)
  endToEndIdTransaction: string;

  @IsUUID(4)
  @IsOptional()
  infractionId?: InfractionId;

  constructor(props: THandleReceivePixRefundEventRequest) {
    super(props);
  }
}

export class HandleReceivePixRefundEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    repository: PixRefundRepository,
    infractionRepository: PixInfractionRepository,
    depositRepository: PixDepositRepository,
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    refundEventEmitter: PixRefundEventEmitterControllerInterface,
    operationService: OperationService,
    pixPaymentOperationCurrencyTag: string,
    pixPaymentOperationPixRefundTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: HandleReceivePixRefundEventController.name,
    });

    const controllerEventEmitter = new PixRefundEventEmitterController(
      refundEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      repository,
      infractionRepository,
      depositRepository,
      devolutionReceivedRepository,
      pixInfractionRefundOperationRepository,
      controllerEventEmitter,
      operationService,
      pixPaymentOperationCurrencyTag,
      pixPaymentOperationPixRefundTransactionTag,
    );
  }

  async execute(request: HandleReceivePixRefundEventRequest): Promise<void> {
    this.logger.debug('Handle receive pix refund event request.', { request });

    const {
      id,
      contested,
      amount,
      description,
      reason,
      requesterIspb,
      responderIspb,
      status,
      infractionId,
      endToEndIdTransaction,
      solicitationPspId,
    } = request;

    const requesterBank = new BankEntity({ ispb: requesterIspb });
    const responderBank = new BankEntity({ ispb: responderIspb });

    const transaction: PixRefundTransaction = {
      endToEndId: endToEndIdTransaction,
    };

    await this.usecase.execute(
      id,
      infractionId,
      contested,
      amount,
      description,
      reason,
      requesterBank,
      responderBank,
      status,
      transaction,
      solicitationPspId,
    );

    this.logger.info('Handle receive pix refund event finished.');
  }
}
