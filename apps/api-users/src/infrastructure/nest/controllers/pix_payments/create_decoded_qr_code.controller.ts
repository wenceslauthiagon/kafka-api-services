import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
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
import {
  cpfMask,
  IsIsoStringDateFormat,
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
  RequestTransactionId,
  TransactionApiHeader,
  getMoment,
} from '@zro/common';
import {
  DecodedQrCodeAdditionalInfo,
  DecodedQrCodeState,
  DecodedQrCodeType,
  PaymentType,
} from '@zro/pix-payments/domain';
import { PersonType, AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  CreateDecodedQrCodeRequest,
  CreateDecodedQrCodeResponse,
} from '@zro/pix-payments/interface';
import { CreateDecodedQrCodeServiceKafka } from '@zro/pix-payments/infrastructure';

export class DecodeQrCodeRestQuery {
  @ApiProperty({
    description: 'QR Emv code.',
  })
  @IsString()
  emv: string;

  @ApiPropertyOptional({
    description: 'Payment estimated date.',
    example: getMoment().format('YYYY-MM-DD'),
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  paymentDate?: Date;
}

export class DecodeQrCodeRestResponse {
  @ApiProperty({
    description: 'Unique decoded UUID.',
    example: 'd5e0bec8-8695-4557-b0dd-021788cd83ef',
  })
  id: string;

  @ApiProperty({
    description: "Payment link's key.",
  })
  key: string;

  @ApiProperty({
    description: 'Payment txid identifier.',
  })
  txid: string;

  @ApiProperty({
    description: 'Document value.',
    example: 1299,
  })
  document_value: number;

  @ApiProperty({
    description: 'Recipient name.',
  })
  recipient_name: string;

  @ApiProperty({
    enum: PersonType,
    description: 'Recipient person type.',
    example: PersonType.LEGAL_PERSON,
  })
  recipient_person_type: PersonType;

  @ApiProperty({
    description: 'Recipient document.',
    example: '***456789**',
  })
  recipient_document: string;

  @ApiProperty({
    description: 'Payment value.',
    example: 1299,
    required: false,
  })
  payment_value?: number;

  @ApiProperty({
    description: 'Expiration date.',
    example: new Date(),
    required: false,
  })
  expiration_date?: Date;

  @ApiProperty({
    enum: PersonType,
    description: 'Payer person type value.',
    example: PersonType.LEGAL_PERSON,
    required: false,
  })
  payer_person_type?: PersonType;

  @ApiProperty({
    description: 'Payer document.',
    example: '***456789**',
    required: false,
  })
  payer_document?: string;

  @ApiProperty({
    description: 'Payer name.',
    required: false,
  })
  payer_name?: string;

  @ApiProperty({
    description: 'Due date.',
    example: new Date(),
    required: false,
  })
  due_date?: Date;

  @ApiProperty({
    description: 'Interest value.',
    example: 1299,
    required: false,
  })
  interest_value?: number;

  @ApiProperty({
    description: 'Fine value.',
    example: 1299,
    required: false,
  })
  fine_value?: number;

  @ApiProperty({
    description: 'Deduction value.',
    example: 1299,
    required: false,
  })
  deduction_value?: number;

  @ApiProperty({
    description: 'Discount value.',
    example: 1299,
    required: false,
  })
  discount_value?: number;

  @ApiProperty({
    enum: DecodedQrCodeState,
    description: 'QR code state.',
    example: DecodedQrCodeState.PENDING,
  })
  state: DecodedQrCodeState;

  @ApiProperty({
    description: 'Created at.',
    example: new Date(),
  })
  created_at: Date;

  @ApiProperty({
    description: 'Change value.',
    example: 1299,
    required: false,
  })
  change_value?: number;

  @ApiProperty({
    description: 'Additional infos object.',
    example: [{ name: 'Juros', value: '10%' }],
    required: false,
  })
  additional_infos?: DecodedQrCodeAdditionalInfo[];

  @ApiProperty({
    description: 'Additional info.',
    required: false,
  })
  additional_info?: string;

  @ApiProperty({
    enum: DecodedQrCodeType,
    description: 'QR code type.',
    example: DecodedQrCodeType.QR_CODE_STATIC_WITHDRAWAL,
  })
  type: DecodedQrCodeType;

  @ApiProperty({
    enum: PaymentType,
    description: 'Payment Type.',
    example: PaymentType.QR_CODE,
  })
  payment_type: PaymentType;

  @ApiProperty({
    description: 'Is value updating allowed?',
    example: true,
    required: false,
  })
  allow_update?: boolean;

  @ApiProperty({
    description: 'Withdrawal value.',
    example: 1299,
    required: false,
  })
  withdraw_value?: number;

  constructor(props: CreateDecodedQrCodeResponse) {
    this.id = props.id;
    this.key = props.key;
    this.txid = props.txId;
    this.document_value = props.documentValue;
    this.additional_info = props.additionalInfo;
    this.recipient_name = props.recipientName;
    this.recipient_person_type = props.recipientPersonType;
    this.recipient_document = cpfMask(props.recipientDocument);
    this.type = props.type;
    this.allow_update = props.allowUpdate;
    this.payment_value = props.paymentValue;
    this.expiration_date = props.expirationDate;
    this.payer_person_type = props.payerPersonType;
    this.payer_document = cpfMask(props.payerDocument);
    this.payer_name = props.payerName;
    this.additional_infos = props.additionalInfos;
    this.withdraw_value = props.withdrawValue;
    this.change_value = props.changeValue;
    this.due_date = props.dueDate;
    this.interest_value = props.interestValue;
    this.fine_value = props.fineValue;
    this.deduction_value = props.deductionValue;
    this.discount_value = props.discountValue;
    this.state = props.state;
    this.created_at = props.createdAt;
    this.payment_type = props.paymentType;
  }
}

// Create Decoded QR code controller. Controller is protected by JWT access token
@ApiTags('Pix | Payments')
@ApiBearerAuth()
@DefaultApiHeaders()
@TransactionApiHeader()
@Controller('pix/payments/decode')
@HasPermission('api-users-get-pix-payments-decode')
export class CreateDecodedQrCodeRestController {
  // Decode QR code endpoint
  @ApiOperation({
    summary: 'Decodes QR code by its emv code.',
  })
  @ApiOkResponse({
    description: 'QR code decoded successfully.',
    type: DecodeQrCodeRestResponse,
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
    @AuthUserParam() user: AuthUser,
    @Query() query: DecodeQrCodeRestQuery,
    @KafkaServiceParam(CreateDecodedQrCodeServiceKafka)
    decodedQrCodeService: CreateDecodedQrCodeServiceKafka,
    @LoggerParam(CreateDecodedQrCodeRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
  ): Promise<DecodeQrCodeRestResponse> {
    // Creates a payload
    const payload: CreateDecodedQrCodeRequest = {
      id: transactionId,
      userId: user.uuid,
      emv: query.emv,
      paymentDate: query.paymentDate,
    };

    logger.debug('Decoding QR code.', { user, payload });

    // Calls QR decoder service.
    const result = await decodedQrCodeService.execute(payload);

    logger.debug('QR code decoded.', { result });

    const response = result && new DecodeQrCodeRestResponse(result);

    return response;
  }
}
