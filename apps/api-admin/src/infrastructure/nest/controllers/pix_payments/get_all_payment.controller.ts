import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import {
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  Sort,
} from '@zro/common';
import {
  AccountType,
  DecodedQrCode,
  PaymentState,
  PaymentType,
} from '@zro/pix-payments/domain';
import {
  GetAllPaymentResponseItem,
  GetAllPaymentResponse,
  GetAllPaymentRequest,
  GetAllPaymentRequestSort,
} from '@zro/pix-payments/interface';
import { GetAllPaymentServiceKafka } from '@zro/pix-payments/infrastructure';
import { PersonType } from '@zro/users/domain';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { AuthAdmin } from '@zro/api-admin/domain';

export class GetAllPaymentParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllPaymentRequestSort,
  })
  @IsOptional()
  @Sort(GetAllPaymentRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    enum: PaymentState,
    description: 'Payment State.',
    example: [PaymentState.SCHEDULED, PaymentState.CONFIRMED],
    isArray: true,
  })
  @Transform((params) =>
    Array.isArray(params.value) ? params.value : [params.value],
  )
  @IsOptional()
  @IsEnum(PaymentState, { each: true })
  states?: PaymentState[];

  @ApiPropertyOptional({
    description: 'User id.',
  })
  @IsUUID(4)
  @IsOptional()
  user_id?: string;
}

class GetAllPaymentRestResponseItem {
  @ApiProperty({
    description: 'Payment id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiPropertyOptional({
    description: 'Payment associated operation id.',
  })
  operation_id?: string;

  @ApiProperty({
    enum: PaymentState,
    description: 'Payment state.',
    example: PaymentState.SCHEDULED,
  })
  state: PaymentState;

  @ApiProperty({
    enum: PaymentType,
    description: 'Payment type.',
    example: PaymentType.ACCOUNT,
  })
  payment_type: string;

  @ApiProperty({
    description: 'Payment value.',
  })
  value: number;

  @ApiPropertyOptional({
    description: 'Payment end to end id.',
  })
  end_to_end_id?: string;

  @ApiPropertyOptional({
    description: 'Payment date.',
  })
  payment_date?: Date;

  @ApiPropertyOptional({
    description: 'Payment description.',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Payment tx id.',
  })
  txid?: string;

  @ApiPropertyOptional({
    description: 'Payment key.',
  })
  key?: string;

  @ApiProperty({
    enum: AccountType,
    description: 'Payment beneficiary account type.',
    example: AccountType.SLRY,
  })
  beneficiary_account_type: AccountType;

  @ApiProperty({
    enum: PersonType,
    description: 'Payment beneficiary person type.',
    example: PersonType.LEGAL_PERSON,
  })
  beneficiary_person_type: PersonType;

  @ApiProperty({
    description: 'Payment beneficiary branch (bank agency).',
  })
  beneficiary_branch: string;

  @ApiProperty({
    description: 'Payment beneficiary account number.',
  })
  beneficiary_account_number: string;

  @ApiProperty({
    description: 'Payment beneficiary bank name.',
  })
  beneficiary_bank_name?: string;

  @ApiProperty({
    description: 'Payment beneficiary bank ispb.',
  })
  beneficiary_bank_ispb: string;

  @ApiProperty({
    description: 'Payment beneficiary document (cpf or cnpj).',
  })
  beneficiary_document: string;

  @ApiProperty({
    description: 'Payment beneficiary name.',
  })
  beneficiary_name?: string;

  @ApiProperty({
    description: 'Payment associated user id.',
  })
  user_id: string;

  @ApiProperty({
    description: 'Payment owner account number.',
  })
  owner_account_number: string;

  @ApiProperty({
    description: 'Payment owner branch.',
  })
  owner_branch: string;

  @ApiProperty({
    description: 'Payment owner document (cpf or cnpj).',
  })
  owner_document: string;

  @ApiProperty({
    description: 'Payment owner full name.',
  })
  owner_full_name: string;

  @ApiProperty({
    description: 'Payment associated decoded qr code.',
  })
  decoded_qr_code: DecodedQrCode;

  @ApiProperty({
    description: 'Payment transaction tag.',
  })
  transaction_tag: string;

  @ApiProperty({
    description: 'Payment created at.',
    example: new Date(),
  })
  created_at: Date;

  @ApiProperty({
    description: 'Payment updated at.',
    example: new Date(),
  })
  updated_at: Date;

  constructor(props: GetAllPaymentResponseItem) {
    this.id = props.id;
    this.operation_id = props.operationId;
    this.state = props.state;
    this.value = props.value;
    this.end_to_end_id = props.endToEndId;
    this.decoded_qr_code = props.decodedQrCode;
    this.payment_date = props.paymentDate;
    this.description = props.description;
    this.txid = props.txId;
    this.key = props.key;
    this.transaction_tag = props.transactionTag;
    this.payment_type = props.paymentType;
    this.beneficiary_account_type = props.beneficiaryAccountType;
    this.beneficiary_person_type = props.beneficiaryPersonType;
    this.beneficiary_branch = props.beneficiaryBranch;
    this.beneficiary_account_number = props.beneficiaryAccountNumber;
    this.beneficiary_bank_name = props.beneficiaryBankName;
    this.beneficiary_bank_ispb = props.beneficiaryBankIspb;
    this.beneficiary_document = props.beneficiaryDocument;
    this.beneficiary_name = props.beneficiaryName;
    this.user_id = props.userId;
    this.owner_account_number = props.ownerAccountNumber;
    this.owner_branch = props.ownerBranch;
    this.owner_document = props.ownerDocument;
    this.owner_full_name = props.ownerFullName;
    this.created_at = props.createdAt;
    this.updated_at = props.updatedAt;
  }
}

export class GetAllPaymentRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Payments data.',
    type: [GetAllPaymentRestResponseItem],
  })
  data!: GetAllPaymentRestResponseItem[];

  constructor(props: GetAllPaymentResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllPaymentRestResponseItem(item),
    );
  }
}

/**
 * Payments controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Payments')
@ApiBearerAuth()
@Controller('pix/payments')
export class GetAllPaymentRestController {
  /**
   * Get payment endpoint.
   */
  @ApiOperation({
    summary: "List user's payments.",
    description: "Get a list of user's payments.",
  })
  @ApiOkResponse({
    description: 'The payments returned successfully.',
    type: GetAllPaymentRestResponse,
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
  @Get()
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @Query() query: GetAllPaymentParams,
    @KafkaServiceParam(GetAllPaymentServiceKafka)
    getAllPaymentService: GetAllPaymentServiceKafka,
    @LoggerParam(GetAllPaymentRestController)
    logger: Logger,
  ): Promise<GetAllPaymentRestResponse> {
    // GetAll payload.
    const payload: GetAllPaymentRequest = {
      // Payment query
      userId: query.user_id,
      states: query.states,
      // Sort query
      page: query.page,
      pageSize: query.size,
      sort: query.sort,
      order: query.order,
    };

    logger.debug('GetAll payments.', { admin, payload });

    // Call get all payment service.
    const result = await getAllPaymentService.execute(payload);

    logger.debug('Payments found.', { result });

    const response = new GetAllPaymentRestResponse(result);

    return response;
  }
}
