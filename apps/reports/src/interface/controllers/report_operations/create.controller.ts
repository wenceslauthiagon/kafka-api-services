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
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { PersonType, User, UserEntity } from '@zro/users/domain';
import {
  OperationType,
  ReportOperation,
  ReportOperationRepository,
} from '@zro/reports/domain';
import { CreateReportOperationUseCase as UseCase } from '@zro/reports/application';
import {
  Currency,
  CurrencyEntity,
  Operation,
  OperationEntity,
  TransactionType,
  TransactionTypeEntity,
} from '@zro/operations/domain';

type OperationId = Operation['id'];
type OperationDate = Operation['createdAt'];
type OperationValue = Operation['value'];

type TransactionTypeId = TransactionType['id'];
type TransactionTypeTag = TransactionType['tag'];
type TransactionTypeTitle = TransactionType['title'];

type ThirdPartId = User['uuid'];
type ThirdPartName = User['name'];
type ThirdPartDocument = User['document'];

type ClientId = User['uuid'];
type ClientName = User['name'];
type ClientDocument = User['document'];

type CurrencySymbol = Currency['symbol'];

type TCreateReportOperationRequest = Pick<
  ReportOperation,
  | 'id'
  | 'operationType'
  | 'thirdPartBankCode'
  | 'thirdPartBranch'
  | 'thirdPartAccountNumber'
  | 'clientBankCode'
  | 'clientBranch'
  | 'clientAccountNumber'
> & {
  operationId: OperationId;
  operationDate: OperationDate;
  operationValue: OperationValue;
  transactionTypeTitle: TransactionTypeTitle;
  transactionTypeId: TransactionTypeId;
  transactionTypeTag: TransactionTypeTag;
  thirdPartId?: ThirdPartId;
  thirdPartName?: ThirdPartName;
  thirdPartDocument?: ThirdPartDocument;
  thirdPartDocumentType?: PersonType;
  clientId: ClientId;
  clientName?: ClientName;
  clientDocument: ClientDocument;
  clientDocumentType?: PersonType;
  currencySymbol?: CurrencySymbol;
};

export class CreateReportOperationRequest
  extends AutoValidator
  implements TCreateReportOperationRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  operationId: OperationId;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format operationDate',
  })
  operationDate: OperationDate;

  @IsInt()
  @IsPositive()
  operationValue: OperationValue;

  @IsEnum(OperationType)
  operationType: OperationType;

  @IsInt()
  @IsPositive()
  transactionTypeId: TransactionTypeId;

  @IsString()
  @MaxLength(255)
  transactionTypeTag: TransactionTypeTag;

  @IsString()
  @MaxLength(255)
  transactionTypeTitle: TransactionTypeTitle;

  @IsOptional()
  @IsUUID(4)
  thirdPartId?: ThirdPartId;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartName?: string;

  @IsString()
  @IsOptional()
  @Length(11, 14)
  thirdPartDocument?: string;

  @IsOptional()
  @IsEnum(PersonType)
  thirdPartDocumentType?: PersonType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  thirdPartBankCode?: string;

  @IsOptional()
  @IsString()
  @Length(4, 4)
  thirdPartBranch?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  thirdPartAccountNumber?: string;

  @IsUUID(4)
  clientId: ClientId;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientName?: ClientName;

  @IsString()
  @Length(11, 14)
  clientDocument: ClientDocument;

  @IsOptional()
  @IsEnum(PersonType)
  clientDocumentType?: PersonType;

  @IsString()
  @MaxLength(255)
  clientBankCode: string;

  @IsString()
  @Length(4, 4)
  clientBranch: string;

  @IsString()
  @MaxLength(255)
  clientAccountNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  currencySymbol?: CurrencySymbol;

  constructor(props: CreateReportOperationRequest) {
    super(props);
  }
}

type TCreateReportOperationResponse = Pick<ReportOperation, 'id'> & {
  operationId: OperationId;
};

export class CreateReportOperationResponse
  extends AutoValidator
  implements TCreateReportOperationResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  operationId: OperationId;

  constructor(props: TCreateReportOperationResponse) {
    super(props);
  }
}

export class CreateReportOperationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    reportOperationRepository: ReportOperationRepository,
  ) {
    this.logger = logger.child({
      context: CreateReportOperationController.name,
    });

    this.usecase = new UseCase(this.logger, reportOperationRepository);
  }

  async execute(
    request: CreateReportOperationRequest,
  ): Promise<CreateReportOperationResponse> {
    this.logger.debug('Create ReportOperation request.', { request });

    const {
      id,
      operationId,
      operationDate,
      operationValue,
      operationType,
      transactionTypeTitle,
      transactionTypeId,
      transactionTypeTag,
      thirdPartId,
      thirdPartName,
      thirdPartDocument,
      thirdPartDocumentType,
      thirdPartBankCode,
      thirdPartBranch,
      thirdPartAccountNumber,
      clientId,
      clientName,
      clientDocument,
      clientDocumentType,
      clientBankCode,
      clientBranch,
      clientAccountNumber,
      currencySymbol,
    } = request;

    const operation = new OperationEntity({
      id: operationId,
      createdAt: operationDate,
      value: operationValue,
    });

    const transactionType = new TransactionTypeEntity({
      id: transactionTypeId,
      title: transactionTypeTitle,
      tag: transactionTypeTag,
    });

    const thirdPart = new UserEntity({
      uuid: thirdPartId,
      name: thirdPartName,
      document: thirdPartDocument,
      type: thirdPartDocumentType,
    });

    const client = new UserEntity({
      uuid: clientId,
      name: clientName,
      document: clientDocument,
      type: clientDocumentType,
    });

    const currency = new CurrencyEntity({
      symbol: currencySymbol,
    });

    const result = await this.usecase.execute(
      id,
      operation,
      operationType,
      transactionType,
      thirdPart,
      thirdPartBankCode,
      thirdPartBranch,
      thirdPartAccountNumber,
      client,
      clientBankCode,
      clientBranch,
      clientAccountNumber,
      currency,
    );

    const response = new CreateReportOperationResponse({
      id: result.id,
      operationId: result.operation.id,
    });

    this.logger.debug('Create ReportOperation response.', {
      response,
    });

    return response;
  }
}
