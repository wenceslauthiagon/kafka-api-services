import { Logger } from 'winston';
import {
  IsDefined,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  BankAccount,
  Client,
  Company,
  PlanRepository,
  QrCodeEntity,
  Transaction,
  TransactionProcessStatus,
  TransactionRepository,
  TransactionStatus,
} from '@zro/pix-zro-pay/domain';
import {
  QrCodeEvent,
  HandleCreateTransactionQrCodeEventUseCase as UseCase,
} from '@zro/pix-zro-pay/application';

type THandleCreateTransactionQrCodeEventRequest = QrCodeEvent;

export class HandleCreateTransactionQrCodeEventRequest
  extends AutoValidator
  implements THandleCreateTransactionQrCodeEventRequest
{
  @IsUUID(4)
  transactionUuid: string;

  @IsString()
  txId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  payerDocument?: number;

  @IsString()
  emv: string;

  @IsOptional()
  @IsString()
  expirationDate?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  value?: number;

  @IsDefined()
  company: Company;

  @IsDefined()
  bankAccount: BankAccount;

  @IsDefined()
  client: Client;

  @IsString()
  merchantId: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleCreateTransactionQrCodeEventRequest) {
    super(props);
  }
}

type THandleCreateTransactionQrCodeEventResponse = Pick<
  Transaction,
  'uuid' | 'status' | 'processStatus' | 'createdAt'
>;

export class HandleCreateTransactionQrCodeEventResponse
  extends AutoValidator
  implements THandleCreateTransactionQrCodeEventResponse
{
  @IsUUID(4)
  uuid: string;

  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsEnum(TransactionProcessStatus)
  processStatus: TransactionProcessStatus;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleCreateTransactionQrCodeEventResponse) {
    super(props);
  }
}

export class HandleCreateTransactionQrCodeEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    transactionRepository: TransactionRepository,
    planRepository: PlanRepository,
  ) {
    this.logger = logger.child({
      context: HandleCreateTransactionQrCodeEventController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      transactionRepository,
      planRepository,
    );
  }

  async execute(
    request: HandleCreateTransactionQrCodeEventRequest,
  ): Promise<HandleCreateTransactionQrCodeEventResponse> {
    this.logger.debug('Handle Create transaction qrCode request.', {
      request,
    });

    const {
      transactionUuid,
      txId,
      description,
      payerDocument,
      emv,
      expirationDate,
      value,
      company,
      bankAccount,
      client,
      merchantId,
      createdAt,
    } = request;

    const qrCode = new QrCodeEntity({
      transactionUuid,
      txId,
      description,
      payerDocument,
      emv,
      expirationDate,
      value,
      company,
      bankAccount,
      client,
      merchantId,
      createdAt,
    });

    const transaction = await this.usecase.execute(qrCode);

    if (!transaction) return null;

    const response = new HandleCreateTransactionQrCodeEventResponse({
      uuid: transaction.uuid,
      status: transaction.status,
      processStatus: transaction.processStatus,
      createdAt: transaction.createdAt,
    });

    this.logger.info('Handle Create transaction qrCode response.', {
      transaction: response,
    });

    return response;
  }
}
