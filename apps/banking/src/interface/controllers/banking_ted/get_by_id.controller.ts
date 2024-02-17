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
import { GetBankingTedByIdUseCase as UseCase } from '@zro/banking/application';
import { Operation } from '@zro/operations/domain';
import { AccountType } from '@zro/pix-payments/domain';

type OperationId = Operation['id'];
type TGetBankingTedByIdRequest = Pick<BankingTed, 'id'>;

export class GetBankingTedByIdRequest
  extends AutoValidator
  implements TGetBankingTedByIdRequest
{
  @IsInt()
  @IsPositive()
  id: number;

  constructor(props: TGetBankingTedByIdRequest) {
    super(props);
  }
}

type TGetBankingTedByIdResponse = Pick<
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

export class GetBankingTedByIdResponse
  extends AutoValidator
  implements TGetBankingTedByIdResponse
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
    message: 'Invalid format createdAt',
  })
  @IsOptional()
  confirmedAt?: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  @IsOptional()
  failedAt?: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  @IsOptional()
  createdAt?: Date;

  constructor(props: TGetBankingTedByIdResponse) {
    super(props);
  }
}

export class GetBankingTedByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankingTedRepository: BankingTedRepository,
  ) {
    this.logger = logger.child({ context: GetBankingTedByIdController.name });

    this.usecase = new UseCase(this.logger, bankingTedRepository);
  }

  async execute(
    request: GetBankingTedByIdRequest,
  ): Promise<GetBankingTedByIdResponse> {
    this.logger.debug('Getting bankingTed by id request.', { request });

    const { id } = request;

    const bankingTed = await this.usecase.execute(id);

    if (!bankingTed) return null;

    const response = new GetBankingTedByIdResponse({
      id: bankingTed.id,
      operationId: bankingTed.operation?.id,
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

    this.logger.info('Getting bankingTed by id response.', {
      bankingTed: response,
    });

    return response;
  }
}
