import { Logger } from 'winston';
import {
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { AutoValidator, isCpf } from '@zro/common';
import { Bank } from '@zro/banking/domain';
import { PersonType, User, UserEntity } from '@zro/users/domain';
import { ReportOperationRepository } from '@zro/reports/domain';
import {
  HandleCreateReportOperationByPixDevolutionReceivedReadyEventUseCase as UseCase,
  OperationService,
} from '@zro/reports/application';
import {
  Operation,
  OperationEntity,
  TransactionTypeEntity,
} from '@zro/operations/domain';
import { PixDevolutionReceived } from '@zro/pix-payments/domain';

type OperationId = Operation['id'];
type BankIspb = Bank['ispb'];
type UserId = User['uuid'];

type THandleCreateReportOperationByPixDevolutionReceivedReadyEventRequest =
  Pick<
    PixDevolutionReceived,
    | 'id'
    | 'transactionTag'
    | 'thirdPartName'
    | 'thirdPartDocument'
    | 'thirdPartBranch'
    | 'thirdPartAccountNumber'
    | 'clientName'
    | 'clientDocument'
    | 'clientBranch'
    | 'clientAccountNumber'
  > & {
    operationId: OperationId;
    thirdPartBankIspb: BankIspb;
    userId: UserId;
  };

export class HandleCreateReportOperationByPixDevolutionReceivedReadyEventRequest
  extends AutoValidator
  implements
    THandleCreateReportOperationByPixDevolutionReceivedReadyEventRequest
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
  thirdPartName: string;

  @IsString()
  @IsOptional()
  @Length(11, 14)
  thirdPartDocument: string;

  @IsString()
  @IsOptional()
  @Length(4, 4)
  thirdPartBranch: string;

  @IsString()
  @Length(8, 8)
  thirdPartBankIspb: BankIspb;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartAccountNumber: string;

  @IsUUID(4)
  userId: UserId;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientName: string;

  @IsString()
  @Length(11, 14)
  clientDocument: string;

  @IsString()
  @Length(4, 4)
  clientBranch: string;

  @IsString()
  @MaxLength(255)
  clientAccountNumber: string;

  constructor(
    props: HandleCreateReportOperationByPixDevolutionReceivedReadyEventRequest,
  ) {
    super(props);
  }
}

export class HandleCreateReportOperationByPixDevolutionReceivedReadyEventController {
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
        HandleCreateReportOperationByPixDevolutionReceivedReadyEventController.name,
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
    request: HandleCreateReportOperationByPixDevolutionReceivedReadyEventRequest,
  ): Promise<void> {
    this.logger.debug(
      'Create report by pix devolution received ready event request.',
      {
        request,
      },
    );

    const {
      id,
      operationId,
      transactionTag,
      thirdPartName,
      thirdPartDocument,
      thirdPartBankIspb,
      thirdPartBranch,
      thirdPartAccountNumber,
      userId,
      clientName,
      clientDocument,
      clientBranch,
      clientAccountNumber,
    } = request;

    const operation = new OperationEntity({
      id: operationId,
    });

    const transactionType = new TransactionTypeEntity({
      tag: transactionTag,
    });

    const thirdPart = new UserEntity({
      name: thirdPartName,
      document: thirdPartDocument,
      ...(thirdPartDocument && {
        type: isCpf(thirdPartDocument)
          ? PersonType.NATURAL_PERSON
          : PersonType.LEGAL_PERSON,
      }),
    });

    const client = new UserEntity({
      uuid: userId,
      name: clientName,
      document: clientDocument,
      ...(clientDocument && {
        type: isCpf(clientDocument)
          ? PersonType.NATURAL_PERSON
          : PersonType.LEGAL_PERSON,
      }),
    });

    await this.usecase.execute(
      id,
      operation,
      transactionType,
      thirdPart,
      thirdPartBankIspb,
      thirdPartBranch,
      thirdPartAccountNumber,
      client,
      clientBranch,
      clientAccountNumber,
    );

    this.logger.debug(
      'Created Report operation by pix devolution received ready.',
    );
  }
}
