import {
  IsDate,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Logger } from 'winston';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  WarningTransaction,
  WarningTransactionAnalysisResultType,
  WarningTransactionEntity,
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import {
  CloseWarningTransactionUseCase,
  PixPaymentService,
} from '@zro/compliance/application';
import { Operation, OperationEntity } from '@zro/operations/domain';
import {
  WarningTransactionEventEmitterController,
  WarningTransactionEventEmitterControllerInterface,
} from '@zro/compliance/interface';

type OperationId = Operation['id'];

type TCloseWarningTransactionRequest = Pick<
  WarningTransaction,
  'analysisResult' | 'analysisDetails'
> & {
  operationId: OperationId;
};

export class CloseWarningTransactionRequest
  extends AutoValidator
  implements TCloseWarningTransactionRequest
{
  @IsUUID(4)
  operationId: OperationId;

  @IsEnum(WarningTransactionAnalysisResultType)
  analysisResult: WarningTransactionAnalysisResultType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  analysisDetails?: string;

  constructor(props: TCloseWarningTransactionRequest) {
    super(props);
  }
}

type TCloseWarningTransactionResponse = Pick<
  WarningTransaction,
  'id' | 'operation' | 'transactionTag' | 'status' | 'createdAt' | 'updatedAt'
>;

export class CloseWarningTransactionResponse
  extends AutoValidator
  implements TCloseWarningTransactionResponse
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

  constructor(props: TCloseWarningTransactionResponse) {
    super(props);
  }
}

export class CloseWarningTransactionController {
  private usecase: CloseWarningTransactionUseCase;

  constructor(
    private logger: Logger,
    private readonly warningTransactionRepository: WarningTransactionRepository,
    private readonly eventEmitter: WarningTransactionEventEmitterControllerInterface,
    private readonly pixPaymentService: PixPaymentService,
  ) {
    this.logger = logger.child({
      context: CloseWarningTransactionController.name,
    });

    const controllerEventEmitter = new WarningTransactionEventEmitterController(
      this.eventEmitter,
    );

    this.usecase = new CloseWarningTransactionUseCase(
      this.warningTransactionRepository,
      controllerEventEmitter,
      this.pixPaymentService,
      this.logger,
    );
  }

  async execute(
    request: CloseWarningTransactionRequest,
  ): Promise<CloseWarningTransactionResponse> {
    this.logger.debug('Close warning transaction request.', { request });

    const { operationId, analysisResult, analysisDetails } = request;

    const operation = new OperationEntity({
      id: operationId,
    });

    const warningTransactionParams = new WarningTransactionEntity({
      operation,
      analysisResult,
      ...(analysisDetails && {
        analysisDetails,
      }),
    });

    const warningTransaction = await this.usecase.execute(
      warningTransactionParams,
    );

    if (!warningTransaction) return null;

    const response = new CloseWarningTransactionResponse({
      id: warningTransaction.id,
      operation: warningTransaction.operation,
      transactionTag: warningTransaction.transactionTag,
      status: warningTransaction.status,
      createdAt: warningTransaction.createdAt,
      updatedAt: warningTransaction.updatedAt,
    });

    this.logger.info('Warning transaction closed response.', {
      warningTransaction: response,
    });

    return response;
  }
}
