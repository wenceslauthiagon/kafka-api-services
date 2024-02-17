import { Logger } from 'winston';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';
import { AutoValidator, IsCnpj, IsIsoStringDateFormat } from '@zro/common';
import {
  BankAccountRepository,
  CashOutSolicitation,
  CashOutSolicitationRepository,
  CashOutSolicitationStatus,
  Company,
  CompanyRepository,
  UserRepository,
} from '@zro/pix-zro-pay/domain';
import { CreateCashOutSolicitationUseCase as UseCase } from '@zro/pix-zro-pay/application';

type CompanyId = Company['id'];

type TCreateCashOutSolicitationRequest = Pick<
  CashOutSolicitation,
  | 'valueCents'
  | 'paymentDate'
  | 'responsibleUserObservation'
  | 'providerHolderName'
  | 'providerHolderCnpj'
  | 'providerBankName'
  | 'providerBankBranch'
  | 'providerBankAccountNumber'
  | 'providerBankIspb'
  | 'providerBankAccountType'
  | 'financialEmail'
> & {
  companyId: CompanyId;
};

export class CreateCashOutSolicitationRequest
  extends AutoValidator
  implements TCreateCashOutSolicitationRequest
{
  @IsInt()
  @IsPositive()
  valueCents: number;

  @IsIsoStringDateFormat('YYYY-MM-DD HH:mm:ss.SSS', {
    message: 'Invalid format paymentDate',
  })
  paymentDate: Date;

  @IsString()
  financialEmail: string;

  @IsNumber()
  companyId: CompanyId;

  @IsString()
  responsibleUserObservation: string;

  @IsString()
  providerHolderName: string;

  @IsCnpj()
  providerHolderCnpj: string;

  @IsString()
  providerBankName: string;

  @IsString()
  providerBankBranch: string;

  @IsString()
  providerBankAccountNumber: string;

  @IsString()
  providerBankIspb: string;

  @IsString()
  providerBankAccountType: string;

  constructor(props: TCreateCashOutSolicitationRequest) {
    super(props);
  }
}

type TCreateCashOutSolicitationResponse = Pick<
  CashOutSolicitation,
  | 'id'
  | 'createdAt'
  | 'valueCents'
  | 'paymentDate'
  | 'status'
  | 'responsibleUserObservation'
  | 'providerHolderName'
  | 'providerHolderCnpj'
  | 'providerBankName'
  | 'providerBankBranch'
  | 'providerBankAccountNumber'
  | 'providerBankIspb'
  | 'providerBankAccountType'
  | 'financialEmail'
>;

export class CreateCashOutSolicitationResponse
  extends AutoValidator
  implements TCreateCashOutSolicitationResponse
{
  @IsNumber()
  id: number;

  @IsInt()
  @IsPositive()
  valueCents: number;

  @IsIsoStringDateFormat('YYYY-MM-DD HH:mm:ss.SSS', {
    message: 'Invalid format paymentDate',
  })
  paymentDate: Date;

  @IsEnum(CashOutSolicitationStatus)
  status: CashOutSolicitationStatus;

  @IsString()
  financialEmail: string;

  @IsString()
  responsibleUserObservation: string;

  @IsString()
  providerHolderName: string;

  @IsCnpj()
  providerHolderCnpj: string;

  @IsString()
  providerBankName: string;

  @IsString()
  providerBankBranch: string;

  @IsString()
  providerBankAccountNumber: string;

  @IsString()
  providerBankIspb: string;

  @IsString()
  providerBankAccountType: string;

  @IsDate()
  createdAt: Date;

  constructor(props: TCreateCashOutSolicitationResponse) {
    super(props);
  }
}

export class CreateCashOutSolicitationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    cashOutSolicitationRepository: CashOutSolicitationRepository,
    companyRepository: CompanyRepository,
    bankAccountRepository: BankAccountRepository,
    userRepository: UserRepository,
  ) {
    this.logger = logger.child({
      context: CreateCashOutSolicitationController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      cashOutSolicitationRepository,
      companyRepository,
      bankAccountRepository,
      userRepository,
    );
  }

  async execute(
    request: CreateCashOutSolicitationRequest,
  ): Promise<CreateCashOutSolicitationResponse> {
    this.logger.debug('Create cash out solicitation request.', { request });

    const {
      valueCents,
      paymentDate,
      responsibleUserObservation,
      providerHolderName,
      providerHolderCnpj,
      providerBankName,
      providerBankBranch,
      providerBankAccountNumber,
      providerBankIspb,
      providerBankAccountType,
      financialEmail,
      companyId,
    } = request;

    const cashOutSolicitation = await this.usecase.execute(
      valueCents,
      paymentDate,
      responsibleUserObservation,
      providerHolderName,
      providerHolderCnpj,
      providerBankName,
      providerBankBranch,
      providerBankAccountNumber,
      providerBankIspb,
      providerBankAccountType,
      financialEmail,
      companyId,
    );

    if (!cashOutSolicitation) return null;

    const response = new CreateCashOutSolicitationResponse({
      id: cashOutSolicitation.id,
      paymentDate: cashOutSolicitation.paymentDate,
      status: cashOutSolicitation.status,
      financialEmail: cashOutSolicitation.financialEmail,
      providerBankAccountNumber: cashOutSolicitation.providerBankAccountNumber,
      providerBankAccountType: cashOutSolicitation.providerBankAccountType,
      providerBankBranch: cashOutSolicitation.providerBankBranch,
      providerBankIspb: cashOutSolicitation.providerBankIspb,
      providerBankName: cashOutSolicitation.providerBankName,
      providerHolderCnpj: cashOutSolicitation.providerHolderCnpj,
      providerHolderName: cashOutSolicitation.providerHolderName,
      responsibleUserObservation:
        cashOutSolicitation.responsibleUserObservation,
      valueCents: cashOutSolicitation.valueCents,
      createdAt: cashOutSolicitation.createdAt,
    });

    this.logger.info('Create cash out solicitation response.', {
      cashOutSolicitation: response,
    });

    return response;
  }
}
