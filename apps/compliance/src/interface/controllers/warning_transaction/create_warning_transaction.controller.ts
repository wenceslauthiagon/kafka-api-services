import { Logger } from 'winston';
import {
  IsEnum,
  IsUUID,
  IsDate,
  IsString,
  IsObject,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  WarningTransaction,
  WarningTransactionEntity,
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import { CreateWarningTransactionUseCase as UseCase } from '@zro/compliance/application';
import {
  WarningTransactionEventEmitterController,
  WarningTransactionEventEmitterControllerInterface,
} from '@zro/compliance/interface';
import { Operation, OperationEntity } from '@zro/operations/domain';

type OperationId = Operation['id'];

type TCreateWarningTransactionRequest = Pick<
  WarningTransaction,
  'transactionTag' | 'endToEndId' | 'reason'
> & {
  operationId: OperationId;
};

export class CreateWarningTransactionRequest
  extends AutoValidator
  implements TCreateWarningTransactionRequest
{
  @IsUUID(4)
  operationId: OperationId;

  @IsString()
  @MaxLength(255)
  transactionTag: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  endToEndId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1900)
  reason?: string;

  constructor(props: TCreateWarningTransactionRequest) {
    super(props);
  }
}

type TCreateWarningTransactionResponse = Pick<
  WarningTransaction,
  'id' | 'operation' | 'transactionTag' | 'status' | 'createdAt' | 'updatedAt'
>;

export class CreateWarningTransactionResponse
  extends AutoValidator
  implements TCreateWarningTransactionResponse
{
  @IsUUID(4)
  id: string;

  @IsObject()
  operation: Operation;

  @IsString()
  transactionTag: string;

  @IsEnum(WarningTransactionStatus)
  status: WarningTransactionStatus;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  @IsDate()
  createdAt: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format updatedAt',
  })
  @IsDate()
  updatedAt: Date;

  constructor(props: TCreateWarningTransactionResponse) {
    super(props);
  }
}

export class CreateWarningTransactionController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    private readonly warningTransactionRepository: WarningTransactionRepository,
    private readonly eventEmitter: WarningTransactionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CreateWarningTransactionController.name,
    });

    const controllerEventEmitter = new WarningTransactionEventEmitterController(
      this.eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      this.warningTransactionRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: CreateWarningTransactionRequest,
  ): Promise<CreateWarningTransactionResponse> {
    this.logger.debug('Create warning transaction request.', { request });

    const { operationId, transactionTag, endToEndId, reason } = request;

    const operation = new OperationEntity({
      id: operationId,
    });

    const warningTransactionParams = new WarningTransactionEntity({
      operation,
      transactionTag,
      endToEndId,
      reason,
    });

    const warningTransaction = await this.usecase.execute(
      warningTransactionParams,
    );

    if (!warningTransaction) return null;

    const response = new CreateWarningTransactionResponse({
      id: warningTransaction.id,
      operation: warningTransaction.operation,
      transactionTag: warningTransaction.transactionTag,
      status: warningTransaction.status,
      createdAt: warningTransaction.createdAt,
      updatedAt: warningTransaction.updatedAt,
    });

    this.logger.info('Warning transaction created response.', {
      warningTransaction: response,
    });

    return response;
  }
}
