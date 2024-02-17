import { Logger } from 'winston';
import {
  IsEnum,
  IsUUID,
  IsDate,
  IsObject,
  IsInt,
  IsPositive,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  WarningTransaction,
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import { Operation, OperationEntity } from '@zro/operations/domain';
import { GetWarningTransactionByOperationUseCase as UseCase } from '@zro/compliance/application';

type OperationId = Operation['id'];

type TGetWarningTransactionByOperationRequest = {
  operationId: OperationId;
};

export class GetWarningTransactionByOperationRequest
  extends AutoValidator
  implements TGetWarningTransactionByOperationRequest
{
  @IsUUID(4)
  operationId: OperationId;

  constructor(props: TGetWarningTransactionByOperationRequest) {
    super(props);
  }
}

type TGetWarningTransactionByOperationResponse = Pick<
  WarningTransaction,
  'id' | 'operation' | 'issueId' | 'status' | 'createdAt' | 'updatedAt'
>;

export class GetWarningTransactionByOperationResponse
  extends AutoValidator
  implements TGetWarningTransactionByOperationResponse
{
  @IsUUID(4)
  id: string;

  @IsObject()
  operation: Operation;

  @IsInt()
  @IsPositive()
  issueId: number;

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

  constructor(props: TGetWarningTransactionByOperationResponse) {
    super(props);
  }
}

export class GetWarningTransactionByOperationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    private readonly warningTransactionRepository: WarningTransactionRepository,
  ) {
    this.logger = logger.child({
      context: GetWarningTransactionByOperationController.name,
    });

    this.usecase = new UseCase(this.logger, this.warningTransactionRepository);
  }

  async execute(
    request: GetWarningTransactionByOperationRequest,
  ): Promise<GetWarningTransactionByOperationResponse> {
    this.logger.debug('Get warning transaction request.', { request });

    const { operationId } = request;

    const operation = new OperationEntity({
      id: operationId,
    });

    const warningTransaction = await this.usecase.execute(operation);

    if (!warningTransaction) return null;

    const response = new GetWarningTransactionByOperationResponse({
      id: warningTransaction.id,
      operation: warningTransaction.operation,
      issueId: warningTransaction.issueId,
      status: warningTransaction.status,
      createdAt: warningTransaction.createdAt,
      updatedAt: warningTransaction.updatedAt,
    });

    this.logger.info('Get Warning transaction response.', {
      warningTransaction: response,
    });

    return response;
  }
}
