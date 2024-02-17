import { Logger } from 'winston';
import {
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { AutoValidator, isCpf } from '@zro/common';
import { PersonType, User, UserEntity } from '@zro/users/domain';
import { ReportOperationRepository } from '@zro/reports/domain';
import {
  HandleCreateReportOperationByPixPaymentConfirmedEventUseCase as UseCase,
  OperationService,
} from '@zro/reports/application';
import {
  Operation,
  OperationEntity,
  TransactionTypeEntity,
} from '@zro/operations/domain';
import { Payment } from '@zro/pix-payments/domain';

type OperationId = Operation['id'];
type UserId = User['uuid'];

type THandleCreateReportOperationByPixPaymentConfirmedEventRequest = Pick<
  Payment,
  | 'id'
  | 'transactionTag'
  | 'beneficiaryName'
  | 'beneficiaryDocument'
  | 'beneficiaryBankIspb'
  | 'beneficiaryBranch'
  | 'beneficiaryAccountNumber'
  | 'ownerFullName'
  | 'ownerDocument'
  | 'ownerBranch'
  | 'ownerAccountNumber'
> & { operationId: OperationId; userId: UserId };

export class HandleCreateReportOperationByPixPaymentConfirmedEventRequest
  extends AutoValidator
  implements THandleCreateReportOperationByPixPaymentConfirmedEventRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  operationId: OperationId;

  @IsString()
  @MaxLength(255)
  transactionTag: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  beneficiaryName?: string;

  @IsString()
  @IsOptional()
  @Length(11, 14)
  beneficiaryDocument: string;

  @IsString()
  @IsOptional()
  @Length(4, 4)
  beneficiaryBranch: string;

  @IsString()
  @Length(8, 8)
  beneficiaryBankIspb: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  beneficiaryAccountNumber: string;

  @IsUUID(4)
  userId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ownerFullName: string;

  @IsString()
  @Length(11, 14)
  ownerDocument: string;

  @IsString()
  @Length(4, 4)
  ownerBranch: string;

  @IsString()
  @MaxLength(255)
  ownerAccountNumber: string;

  constructor(
    props: HandleCreateReportOperationByPixPaymentConfirmedEventRequest,
  ) {
    super(props);
  }
}

export class HandleCreateReportOperationByPixPaymentConfirmedEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    reportOperationRepository: ReportOperationRepository,
    operationService: OperationService,
    operationCurrencyTag: string,
    zroBankIspb: string,
  ) {
    this.logger = logger.child({
      context:
        HandleCreateReportOperationByPixPaymentConfirmedEventController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      reportOperationRepository,
      operationService,
      operationCurrencyTag,
      zroBankIspb,
    );
  }

  async execute(
    request: HandleCreateReportOperationByPixPaymentConfirmedEventRequest,
  ): Promise<void> {
    this.logger.debug('Create report by pix payment confirmed event request.', {
      request,
    });

    const {
      id,
      operationId,
      transactionTag,
      beneficiaryName,
      beneficiaryDocument,
      beneficiaryBankIspb,
      beneficiaryBranch,
      beneficiaryAccountNumber,
      userId,
      ownerFullName,
      ownerDocument,
      ownerBranch,
      ownerAccountNumber,
    } = request;

    const operation = new OperationEntity({
      id: operationId,
    });

    const transactionType = new TransactionTypeEntity({
      tag: transactionTag,
    });

    const beneficiary = new UserEntity({
      name: beneficiaryName,
      document: beneficiaryDocument,
      ...(beneficiaryDocument && {
        type: isCpf(beneficiaryDocument)
          ? PersonType.NATURAL_PERSON
          : PersonType.LEGAL_PERSON,
      }),
    });

    const owner = new UserEntity({
      uuid: userId,
      name: ownerFullName,
      document: ownerDocument,
      ...(ownerDocument && {
        type: isCpf(ownerDocument)
          ? PersonType.NATURAL_PERSON
          : PersonType.LEGAL_PERSON,
      }),
    });

    await this.usecase.execute(
      id,
      operation,
      transactionType,
      beneficiary,
      beneficiaryBankIspb,
      beneficiaryBranch,
      beneficiaryAccountNumber,
      owner,
      ownerBranch,
      ownerAccountNumber,
    );

    this.logger.debug('Created Report operation by pix payment confirmed.');
  }
}
