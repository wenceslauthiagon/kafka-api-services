import { Logger } from 'winston';
import { Controller, Body, Post } from '@nestjs/common';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import {
  IsString,
  IsPositive,
  IsInt,
  IsEmail,
  IsNumberString,
} from 'class-validator';
import {
  IsCnpj,
  IsIsoStringDateFormat,
  KafkaServiceParam,
  LoggerParam,
  getMoment,
} from '@zro/common';
import {
  AuthCompany,
  CashOutSolicitationStatus,
} from '@zro/pix-zro-pay/domain';
import {
  CreateCashOutSolicitationRequest,
  CreateCashOutSolicitationResponse,
} from '@zro/pix-zro-pay/interface';
import {
  AuthCompanyParam,
  CreateCashOutSolicitationServiceKafka,
} from '@zro/pix-zro-pay/infrastructure';

class CreateCashOutSolicitationBody {
  @ApiProperty({
    description: 'Value cents.',
    example: 120,
  })
  @IsInt()
  @IsPositive()
  value_cents: number;

  @ApiProperty({
    description: 'Payment date.',
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
    example: getMoment().format('YYYY-MM-DD HH:mm:ss.SSS'),
    required: false,
  })
  @IsIsoStringDateFormat('YYYY-MM-DD HH:mm:ss.SSS')
  payment_date: Date;

  @ApiProperty({
    description: 'Financial email.',
    example: 'financial@gmail.com',
  })
  @IsString()
  @IsEmail()
  financial_email: string;

  @ApiProperty({
    description: 'Responsible user observation.',
    example: 'Obs',
  })
  @IsString()
  responsible_user_observation: string;

  @ApiProperty({
    description: 'Provider holder name.',
    example: 'Holder',
  })
  @IsString()
  provider_holder_name: string;

  @ApiProperty({
    description: 'Provider holder CNPJ.',
    example: '71083191000140',
  })
  @IsCnpj()
  provider_holder_cnpj: string;

  @ApiProperty({
    description: 'Provider bank name.',
    example: 'Financial',
  })
  @IsString()
  provider_bank_name: string;

  @ApiProperty({
    description: 'Provider bank branch.',
    example: '0001',
  })
  @IsString()
  @IsNumberString()
  provider_bank_branch: string;

  @ApiProperty({
    description: 'Provider bank account number.',
    example: '1111111111111',
  })
  @IsString()
  @IsNumberString()
  provider_bank_account_number: string;

  @ApiProperty({
    description: 'Provider bank ISPB.',
    example: '1111',
  })
  @IsString()
  @IsNumberString()
  provider_bank_ispb: string;

  @ApiProperty({
    description: 'Provider bank account type.',
    example: 'CC',
  })
  @IsString()
  provider_bank_account_type: string;
}

class CreateCashOutSolicitationRestResponse {
  @ApiProperty({
    description: 'ID.',
    example: 120,
  })
  id: number;

  @ApiProperty({
    description: 'Value cents.',
    example: 120,
  })
  value_cents: number;

  @ApiProperty({
    description: 'Payment date.',
    example: new Date(),
  })
  payment_date: Date;

  @ApiProperty({
    description: 'Financial email.',
    example: 'financial@gmail.com',
  })
  financial_email: string;

  @ApiProperty({
    description: 'Cashout solicitation Status.',
    example: CashOutSolicitationStatus.PENDING,
  })
  status: CashOutSolicitationStatus;

  @ApiProperty({
    description: 'Responsible user observation.',
    example: 'Obs',
  })
  responsible_user_observation: string;

  @ApiProperty({
    description: 'Provider holder name.',
    example: 'Recebedor',
  })
  provider_holder_name: string;

  @ApiProperty({
    description: 'Provider holder CNPJ.',
    example: '71083191000140',
  })
  provider_holder_cnpj: string;

  @ApiProperty({
    description: 'Provider bank name.',
    example: 'Financial',
  })
  provider_bank_name: string;

  @ApiProperty({
    description: 'Provider bank branch.',
    example: '0001',
  })
  provider_bank_branch: string;

  @ApiProperty({
    description: 'Provider bank account number.',
    example: '1111111111111',
  })
  provider_bank_account_number: string;

  @ApiProperty({
    description: 'Provider bank ISPB.',
    example: '1111',
  })
  provider_bank_ispb: string;

  @ApiProperty({
    description: 'Provider bank account type.',
    example: 'checking account',
  })
  provider_bank_account_type: string;

  @ApiProperty({
    description: 'Cash out solicitation created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: CreateCashOutSolicitationResponse) {
    this.id = props.id;
    this.value_cents = props.valueCents;
    this.financial_email = props.financialEmail;
    this.status = props.status;
    this.payment_date = props.paymentDate;
    this.provider_bank_account_number = props.providerBankAccountNumber;
    this.provider_bank_account_type = props.providerBankAccountType;
    this.provider_bank_branch = props.providerBankBranch;
    this.provider_bank_ispb = props.providerBankIspb;
    this.provider_bank_name = props.providerBankName;
    this.provider_holder_cnpj = props.providerHolderCnpj;
    this.provider_holder_name = props.providerHolderName;
    this.responsible_user_observation = props.responsibleUserObservation;
    this.created_at = props.createdAt;
  }
}

/**
 * Create CashouSolicitation controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Transactions')
@ApiBearerAuth()
@Controller('pix/transactions/cashout-solicitation')
export class CreateCashOutSolicitationRestController {
  /**
   * create requested payments endpoint.
   */
  @ApiOperation({
    summary: 'Create new cash out solicitation.',
    description:
      "Enter the cash out solicitation's information on the requisition body below and execute to create a new cash out solicitation.",
  })
  @ApiCreatedResponse({
    description: 'The  returned successfully.',
    type: CreateCashOutSolicitationRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'User authentication failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Post()
  async execute(
    @AuthCompanyParam() company: AuthCompany,
    @KafkaServiceParam(CreateCashOutSolicitationServiceKafka)
    createService: CreateCashOutSolicitationServiceKafka,
    @LoggerParam(CreateCashOutSolicitationRestController)
    logger: Logger,
    @Body() body: CreateCashOutSolicitationBody,
  ): Promise<CreateCashOutSolicitationRestResponse> {
    // Create a payload.
    const payload: CreateCashOutSolicitationRequest = {
      valueCents: body.value_cents,
      paymentDate: body.payment_date,
      responsibleUserObservation: body.responsible_user_observation,
      providerHolderName: body.provider_holder_name,
      providerHolderCnpj: body.provider_holder_cnpj,
      providerBankName: body.provider_bank_name,
      providerBankBranch: body.provider_bank_branch,
      providerBankAccountNumber: body.provider_bank_account_number,
      providerBankIspb: body.provider_bank_ispb,
      providerBankAccountType: body.provider_bank_account_type,
      financialEmail: body.financial_email,
      companyId: company.id,
    };

    logger.debug('Create CashOut Solicitation.', { payload });

    // Call create request for payments service.
    const result = await createService.execute(payload);

    logger.debug('CashOut Solicitation created.', result);

    const response = new CreateCashOutSolicitationRestResponse(result);

    return response;
  }
}
