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
import {
  CreateReportOperationByGatewayUseCase as UseCase,
  OperationService,
  UserService,
} from '@zro/reports/application';
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
type TransactionTypeTag = TransactionType['tag'];

type ThirdPartName = User['name'];
type ThirdPartDocument = User['document'];

type ClientId = User['uuid'];
type ClientName = User['name'];
type ClientDocument = User['document'];

type CurrencySymbol = Currency['symbol'];

type TCreateReportOperationByGatewayRequest = Pick<
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
  transactionTypeTag: TransactionTypeTag;
  thirdPartName?: ThirdPartName;
  thirdPartDocument?: ThirdPartDocument;
  thirdPartDocumentType?: PersonType;
  clientName?: ClientName;
  clientDocument: ClientDocument;
  clientDocumentType?: PersonType;
  currencySymbol?: CurrencySymbol;
};

export class CreateReportOperationByGatewayRequest
  extends AutoValidator
  implements TCreateReportOperationByGatewayRequest
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

  @IsString()
  @MaxLength(255)
  transactionTypeTag: TransactionTypeTag;

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

  constructor(props: CreateReportOperationByGatewayRequest) {
    super(props);
  }
}

type TCreateReportOperationByGatewayResponse = Pick<
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
  transactionTypeTag: TransactionTypeTag;
  thirdPartName?: ThirdPartName;
  thirdPartDocument: ThirdPartDocument;
  thirdPartDocumentType?: PersonType;
  clientId: ClientId;
  clientName?: ClientName;
  clientDocument: ClientDocument;
  clientDocumentType?: PersonType;
  currencySymbol?: CurrencySymbol;
};

export class CreateReportOperationByGatewayResponse
  extends AutoValidator
  implements TCreateReportOperationByGatewayResponse
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

  @IsString()
  @MaxLength(255)
  transactionTypeTag: TransactionTypeTag;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartName?: string;

  @IsString()
  @Length(11, 14)
  thirdPartDocument: string;

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

  @IsUUID(4)
  clientId: ClientId;

  constructor(props: TCreateReportOperationByGatewayResponse) {
    super(props);
  }
}

export class CreateReportOperationByGatewayController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    reportOperationRepository: ReportOperationRepository,
    operationService: OperationService,
    userService: UserService,
  ) {
    this.logger = logger.child({
      context: CreateReportOperationByGatewayController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      reportOperationRepository,
      operationService,
      userService,
    );
  }

  async execute(
    request: CreateReportOperationByGatewayRequest,
  ): Promise<CreateReportOperationByGatewayResponse> {
    this.logger.debug('Create ReportOperationByGateway request.', { request });

    const {
      id,
      operationId,
      operationDate,
      operationValue,
      operationType,
      transactionTypeTag,
      thirdPartName,
      thirdPartDocument,
      thirdPartDocumentType,
      thirdPartBankCode,
      thirdPartBranch,
      thirdPartAccountNumber,
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
      tag: transactionTypeTag,
    });

    const thirdPart = new UserEntity({
      name: thirdPartName,
      document: thirdPartDocument,
      type: thirdPartDocumentType,
    });

    const client = new UserEntity({
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

    const response = new CreateReportOperationByGatewayResponse({
      id: result.id,
      operationId: result.operation.id,
      operationDate: result.operation.createdAt,
      operationValue: result.operation.value,
      operationType: result.operationType,
      transactionTypeTag: result.transactionType.tag,
      thirdPartName: result.thirdPart?.name,
      thirdPartDocument: result.thirdPart?.document,
      thirdPartDocumentType: result.thirdPart?.type,
      thirdPartBankCode: result.thirdPartBankCode,
      thirdPartBranch: result.thirdPartBranch,
      thirdPartAccountNumber: result.thirdPartAccountNumber,
      clientId: result.client.uuid,
      clientName: result.client?.name,
      clientDocument: result.client.document,
      clientDocumentType: result.client?.type,
      clientBankCode: result.clientBankCode,
      clientBranch: result.clientBranch,
      clientAccountNumber: result.clientAccountNumber,
      currencySymbol: result.currency?.symbol,
    });

    this.logger.debug('Create ReportOperationByGateway response.', {
      response,
    });

    return response;
  }
}
