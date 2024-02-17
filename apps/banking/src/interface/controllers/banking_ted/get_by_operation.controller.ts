import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  BankingTed,
  BankingTedRepository,
  BankingTedState,
} from '@zro/banking/domain';
import { GetBankingTedByOperationUseCase as UseCase } from '@zro/banking/application';
import { Operation, OperationEntity } from '@zro/operations/domain';
import { AccountType } from '@zro/pix-payments/domain';

type OperationId = Operation['id'];
type TGetBankingTedByOperationRequest = {
  operationId: OperationId;
};

export class GetBankingTedByOperationRequest
  extends AutoValidator
  implements TGetBankingTedByOperationRequest
{
  @IsUUID(4)
  operationId: OperationId;

  constructor(props: TGetBankingTedByOperationRequest) {
    super(props);
  }
}

type TGetBankingTedByOperationResponse = Pick<
  BankingTed,
  | 'id'
  | 'amount'
  | 'state'
  | 'transactionId'
  | 'beneficiaryBankName'
  | 'beneficiaryBankCode'
  | 'beneficiaryName'
  | 'beneficiaryType'
  | 'beneficiaryDocument'
  | 'beneficiaryAgency'
  | 'beneficiaryAccount'
  | 'beneficiaryAccountDigit'
  | 'beneficiaryAccountType'
  | 'createdAt'
  | 'confirmedAt'
  | 'failedAt'
> & { operationId: OperationId };

export class GetBankingTedByOperationResponse
  extends AutoValidator
  implements TGetBankingTedByOperationResponse
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsUUID(4)
  operationId: OperationId;

  @IsOptional()
  @IsEnum(BankingTedState)
  state?: BankingTedState;

  @IsOptional()
  @IsInt()
  @IsPositive()
  amount?: number;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  beneficiaryBankName?: string;

  @IsString()
  @MaxLength(255)
  beneficiaryBankCode: string;

  @IsString()
  @MaxLength(255)
  beneficiaryName: string;

  @IsString()
  @MaxLength(255)
  beneficiaryType: string;

  @IsString()
  @MaxLength(255)
  beneficiaryDocument: string;

  @IsString()
  @MaxLength(255)
  beneficiaryAgency: string;

  @IsString()
  @MaxLength(255)
  beneficiaryAccount: string;

  @IsString()
  @MaxLength(255)
  beneficiaryAccountDigit: string;

  @IsEnum(AccountType)
  beneficiaryAccountType: AccountType;

  @IsUUID(4)
  @IsOptional()
  transactionId?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format confirmedAt',
  })
  @IsOptional()
  confirmedAt?: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format failedAt',
  })
  @IsOptional()
  failedAt?: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  @IsOptional()
  createdAt?: Date;

  constructor(props: TGetBankingTedByOperationResponse) {
    super(props);
  }
}

export class GetBankingTedByOperationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankingTedRepository: BankingTedRepository,
  ) {
    this.logger = logger.child({
      context: GetBankingTedByOperationController.name,
    });

    this.usecase = new UseCase(this.logger, bankingTedRepository);
  }

  async execute(
    request: GetBankingTedByOperationRequest,
  ): Promise<GetBankingTedByOperationResponse> {
    this.logger.debug('Getting BankingTed by Operation request.', {
      request,
    });

    const { operationId } = request;

    const operation = new OperationEntity({
      id: operationId,
    });

    const bankingTed = await this.usecase.execute(operation);

    if (!bankingTed) return null;

    const response = new GetBankingTedByOperationResponse({
      id: bankingTed.id,
      operationId: bankingTed.operation.id,
      state: bankingTed.state,
      amount: bankingTed.amount,
      beneficiaryBankName: bankingTed.beneficiaryBankName,
      beneficiaryBankCode: bankingTed.beneficiaryBankCode,
      beneficiaryName: bankingTed.beneficiaryName,
      beneficiaryType: bankingTed.beneficiaryType,
      beneficiaryDocument: bankingTed.beneficiaryDocument,
      beneficiaryAgency: bankingTed.beneficiaryAgency,
      beneficiaryAccount: bankingTed.beneficiaryAccount,
      beneficiaryAccountDigit: bankingTed.beneficiaryAccountDigit,
      beneficiaryAccountType: bankingTed.beneficiaryAccountType,
      transactionId: bankingTed.transactionId,
      confirmedAt: bankingTed.confirmedAt,
      failedAt: bankingTed.failedAt,
      createdAt: bankingTed.createdAt,
    });

    this.logger.info('Getting Banking Ted by Operation response.', {
      bankingTed: response,
    });

    return response;
  }
}
