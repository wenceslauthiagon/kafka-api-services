import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { Bank, BankEntity } from '@zro/banking/domain';
import {
  AccountType,
  Payment,
  PaymentEntity,
  PaymentRepository,
  PixDevolutionReceived,
  PixDevolutionReceivedRepository,
  PixDevolutionReceivedState,
} from '@zro/pix-payments/domain';
import {
  BankingService,
  OperationService,
  ReceivePixDevolutionReceivedUseCase as UseCase,
} from '@zro/pix-payments/application';
import {
  PixDevolutionReceivedEventEmitterController,
  PixDevolutionReceivedEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type BankIspb = Bank['ispb'];
type PaymentId = Payment['id'];
type PaymentEndToEndId = Payment['endToEndId'];

type TReceivePixDevolutionReceivedRequest = Pick<
  PixDevolutionReceived,
  | 'id'
  | 'amount'
  | 'txId'
  | 'endToEndId'
  | 'clientBranch'
  | 'clientAccountNumber'
  | 'clientDocument'
  | 'clientName'
  | 'clientKey'
  | 'thirdPartBranch'
  | 'thirdPartAccountType'
  | 'thirdPartAccountNumber'
  | 'thirdPartDocument'
  | 'thirdPartName'
  | 'thirdPartKey'
  | 'description'
> & {
  clientBankIspb: BankIspb;
  thirdPartBankIspb: BankIspb;
  paymentId?: PaymentId;
  paymentEndToEndId?: PaymentEndToEndId;
};

export class ReceivePixDevolutionReceivedRequest
  extends AutoValidator
  implements TReceivePixDevolutionReceivedRequest
{
  @IsUUID(4)
  id: string;

  @ValidateIf(
    (obj: ReceivePixDevolutionReceivedRequest) => !obj.paymentEndToEndId,
  )
  @IsUUID(4)
  paymentId?: PaymentId;

  @ValidateIf((obj: ReceivePixDevolutionReceivedRequest) => !obj.paymentId)
  @IsString()
  @MaxLength(255)
  paymentEndToEndId?: PaymentEndToEndId;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  txId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  endToEndId: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  @Length(8, 8)
  clientBankIspb: BankIspb;

  @IsString()
  @IsOptional()
  @Length(4, 4)
  clientBranch: string;

  @IsString()
  @MaxLength(255)
  clientAccountNumber: string;

  @IsString()
  @Length(11, 14)
  clientDocument: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  clientName: string;

  @IsString()
  @IsOptional()
  @MaxLength(77)
  clientKey: string;

  @IsString()
  @Length(8, 8)
  thirdPartBankIspb: BankIspb;

  @IsString()
  @IsOptional()
  @Length(4, 4)
  thirdPartBranch: string;

  @IsOptional()
  @IsEnum(AccountType)
  thirdPartAccountType: AccountType;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartAccountNumber: string;

  @IsString()
  @IsOptional()
  @Length(11, 14)
  thirdPartDocument: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartName: string;

  @IsString()
  @IsOptional()
  @MaxLength(77)
  thirdPartKey: string;

  @IsString()
  @IsOptional()
  @MaxLength(140)
  description: string;

  constructor(props: TReceivePixDevolutionReceivedRequest) {
    super(props);
  }
}

type TReceivePixDevolutionReceivedResponse = Pick<
  PixDevolutionReceived,
  'id' | 'state' | 'createdAt'
>;

export class ReceivePixDevolutionReceivedResponse
  extends AutoValidator
  implements TReceivePixDevolutionReceivedResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixDevolutionReceivedState)
  state: PixDevolutionReceivedState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TReceivePixDevolutionReceivedResponse) {
    super(props);
  }
}

export class ReceivePixDevolutionReceivedController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    pixPaymentRepository: PaymentRepository,
    eventEmitter: PixDevolutionReceivedEventEmitterControllerInterface,
    operationService: OperationService,
    bankingService: BankingService,
    pixPaymentOperationCurrencyTag: string,
    pixDevolutionReceivedOperationTransactionTag: string,
    pixPaymentZroBankIspb: string,
  ) {
    this.logger = logger.child({
      context: ReceivePixDevolutionReceivedController.name,
    });

    const controllerEventEmitter =
      new PixDevolutionReceivedEventEmitterController(eventEmitter);

    this.usecase = new UseCase(
      this.logger,
      devolutionReceivedRepository,
      pixPaymentRepository,
      controllerEventEmitter,
      operationService,
      bankingService,
      pixPaymentOperationCurrencyTag,
      pixDevolutionReceivedOperationTransactionTag,
      pixPaymentZroBankIspb,
    );
  }

  async execute(
    request: ReceivePixDevolutionReceivedRequest,
  ): Promise<ReceivePixDevolutionReceivedResponse> {
    this.logger.debug('Receive Pix devolutionReceived request.', { request });

    const {
      id,
      paymentId,
      paymentEndToEndId,
      amount,
      txId,
      endToEndId,
      clientBankIspb,
      clientBranch,
      clientAccountNumber,
      clientDocument,
      clientName,
      clientKey,
      thirdPartBankIspb,
      thirdPartBranch,
      thirdPartAccountType,
      thirdPartAccountNumber,
      thirdPartDocument,
      thirdPartName,
      thirdPartKey,
      description,
    } = request;

    const clientBank = new BankEntity({ ispb: clientBankIspb });
    const thirdPartBank = new BankEntity({ ispb: thirdPartBankIspb });
    const payment = new PaymentEntity({
      ...(request.paymentId && { id: paymentId }),
      ...(request.paymentEndToEndId && { endToEndId: paymentEndToEndId }),
    });

    const devolutionReceived = await this.usecase.execute(
      id,
      payment,
      amount,
      txId,
      endToEndId,
      clientBank,
      clientBranch,
      clientAccountNumber,
      clientDocument,
      clientName,
      clientKey,
      thirdPartBank,
      thirdPartBranch,
      thirdPartAccountType,
      thirdPartAccountNumber,
      thirdPartDocument,
      thirdPartName,
      thirdPartKey,
      description,
    );

    if (!devolutionReceived) return null;

    const response = new ReceivePixDevolutionReceivedResponse({
      id: devolutionReceived.id,
      state: devolutionReceived.state,
      createdAt: devolutionReceived.createdAt,
    });

    this.logger.info('Receive Pix devolutionReceived response.', {
      devolutionReceived: response,
    });

    return response;
  }
}
