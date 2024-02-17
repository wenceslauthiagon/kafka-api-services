import { Logger } from 'winston';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  BankingTedReceived,
  BankingTedReceivedRepository,
} from '@zro/banking/domain';
import { GetBankingTedReceivedByOperationUseCase as UseCase } from '@zro/banking/application';
import { Operation, OperationEntity } from '@zro/operations/domain';

type OperationId = Operation['id'];
type TGetBankingTedReceivedByOperationRequest = {
  operationId: OperationId;
};

export class GetBankingTedReceivedByOperationRequest
  extends AutoValidator
  implements TGetBankingTedReceivedByOperationRequest
{
  @IsUUID(4)
  operationId: OperationId;

  constructor(props: TGetBankingTedReceivedByOperationRequest) {
    super(props);
  }
}

type TGetBankingTedReceivedByOperationResponse = Pick<
  BankingTedReceived,
  | 'id'
  | 'transactionId'
  | 'ownerName'
  | 'ownerDocument'
  | 'ownerBankAccount'
  | 'ownerBankBranch'
  | 'ownerBankCode'
  | 'ownerBankName'
  | 'bankStatementId'
  | 'notifiedAt'
  | 'createdAt'
  | 'updatedAt'
> & { operationId: OperationId };

export class GetBankingTedReceivedByOperationResponse
  extends AutoValidator
  implements TGetBankingTedReceivedByOperationResponse
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsUUID(4)
  operationId: OperationId;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  transactionId?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  ownerName?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  ownerDocument?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  ownerBankAccount?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  ownerBankBranch?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  ownerBankCode?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  ownerBankName?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  bankStatementId?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format notifiedAt',
  })
  @IsOptional()
  notifiedAt?: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format updatedAt',
  })
  updatedAt: Date;

  constructor(props: TGetBankingTedReceivedByOperationResponse) {
    super(props);
  }
}

export class GetBankingTedReceivedByOperationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankingTedReceivedRepository: BankingTedReceivedRepository,
  ) {
    this.logger = logger.child({
      context: GetBankingTedReceivedByOperationController.name,
    });

    this.usecase = new UseCase(this.logger, bankingTedReceivedRepository);
  }

  async execute(
    request: GetBankingTedReceivedByOperationRequest,
  ): Promise<GetBankingTedReceivedByOperationResponse> {
    this.logger.debug('Getting BankingTedReceived by Operation request.', {
      request,
    });

    const { operationId } = request;

    const operation = new OperationEntity({
      id: operationId,
    });

    const bankingTedReceived = await this.usecase.execute(operation);

    if (!bankingTedReceived) return null;

    const response = new GetBankingTedReceivedByOperationResponse({
      id: bankingTedReceived.id,
      operationId: bankingTedReceived.operation.id,
      transactionId: bankingTedReceived.transactionId,
      ownerName: bankingTedReceived.ownerName,
      ownerDocument: bankingTedReceived.ownerDocument,
      ownerBankAccount: bankingTedReceived.ownerBankAccount,
      ownerBankBranch: bankingTedReceived.ownerBankBranch,
      ownerBankCode: bankingTedReceived.ownerBankCode,
      ownerBankName: bankingTedReceived.ownerBankName,
      bankStatementId: bankingTedReceived.bankStatementId,
      notifiedAt: bankingTedReceived.notifiedAt,
      createdAt: bankingTedReceived.createdAt,
      updatedAt: bankingTedReceived.updatedAt,
    });

    this.logger.info('Getting BankingTedReceived by Operation response.', {
      bankingTed: response,
    });

    return response;
  }
}
