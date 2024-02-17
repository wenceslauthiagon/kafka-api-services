import { Controller, Body, Post } from '@nestjs/common';
import { Logger } from 'winston';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsPositive,
  MaxLength,
  IsEmail,
  Length,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import {
  KafkaServiceParam,
  LoggerParam,
  SanitizeHtml,
  IsIsoStringDateFormat,
  IsDateAfterThanNow,
  HasPermission,
  DefaultApiHeaders,
  RequestTransactionId,
  TransactionApiHeader,
  getMoment,
  isCpf,
  isCnpj,
} from '@zro/common';
import { PixQrCodeDynamicState } from '@zro/pix-payments/domain';
import { AuthUser, PersonType } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  CreateQrCodeDynamicDueDateRequest,
  CreateQrCodeDynamicDueDateResponse,
} from '@zro/pix-payments/interface';
import { CreateQrCodeDynamicDueDateServiceKafka } from '@zro/pix-payments/infrastructure';

class CreateQrCodeDynamicDueDateBody {
  @ApiProperty({
    description: 'Pix key.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsString()
  @MaxLength(77)
  key: string;

  @ApiProperty({
    description: 'Value in R$ cents',
    example: 2300,
  })
  @IsPositive()
  document_value: number;

  @ApiProperty({
    description: 'Document due date.',
    example: getMoment().format('YYYY-MM-DD'),
  })
  @IsIsoStringDateFormat('YYYY-MM-DD')
  due_date: Date;

  @ApiPropertyOptional({
    description: 'Expiration date to pay qrCode.',
    example: getMoment().format('YYYY-MM-DD'),
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateAfterThanNow('YYYY-MM-DD', false)
  expiration_date?: Date;

  @ApiPropertyOptional({
    description: 'User friendly QR code identifier.',
    example: 'party-payment',
  })
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  summary?: string;

  @ApiProperty({
    description: 'User defined payment description.',
    example: 'User defined description',
  })
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  description: string;

  @ApiPropertyOptional({
    description: 'Payer city (IBGE city code).',
    example: '2611606',
  })
  @IsOptional()
  @IsString()
  @Length(7, 7)
  payer_city?: string;

  @ApiProperty({
    description: `Person type:<br>
    <ul>
      <li>${PersonType.NATURAL_PERSON}.
      <li>${PersonType.LEGAL_PERSON}.
    </ul>`,
    example: PersonType.LEGAL_PERSON,
  })
  @IsEnum(PersonType)
  payer_person_type: PersonType;

  @ApiProperty({
    description: 'Payer document number.',
    example: '78762893041',
  })
  @IsString()
  @Length(11, 14)
  @ValidateIf(
    (obj, val) =>
      (obj.payer_person_type === PersonType.NATURAL_PERSON && isCpf(val)) ||
      (obj.payer_person_type === PersonType.LEGAL_PERSON && isCnpj(val)),
  )
  payer_document: string;

  @ApiProperty({
    description: 'Payer name.',
    example: 'Jonh Doe',
  })
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  payer_name: string;

  @ApiPropertyOptional({
    description: 'Payer email.',
    example: 'nobody@zrobank.biz',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(140)
  payer_email?: string;

  @ApiPropertyOptional({
    description: 'Payer phone.',
    example: '5581987654321',
  })
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(15)
  payer_phone?: string;

  @ApiPropertyOptional({
    description: 'Payer address.',
    example: 'Main Street 1, 9.',
  })
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  payer_address?: string;

  @ApiPropertyOptional({
    description: 'Payer request.',
    example: 'Send receipt to my email.',
  })
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  payer_request?: string;
}

class CreateQrCodeDynamicDueDateRestResponse {
  @ApiProperty({
    description: 'Qr code ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'Associated key UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  key_id: string;

  @ApiProperty({
    enum: PixQrCodeDynamicState,
    description: 'Qr code state.',
    example: PixQrCodeDynamicState.PENDING,
  })
  state: PixQrCodeDynamicState;

  @ApiPropertyOptional({
    description: 'User defined payment ID.',
    example: 'party-payment',
  })
  summary?: string;

  @ApiProperty({
    description: 'User defined payment description.',
    example: 'The party payment.',
  })
  description: string;

  @ApiPropertyOptional({
    description: 'Due date to pay qrCode.',
  })
  due_date: Date;

  @ApiPropertyOptional({
    description: 'Expiration date to pay qrCode.',
  })
  expiration_date?: Date;

  @ApiProperty({
    description: 'Qr code created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: CreateQrCodeDynamicDueDateResponse) {
    this.id = props.id;
    this.key_id = props.keyId;
    this.summary = props.summary;
    this.description = props.description;
    this.state = props.state;
    this.due_date = props.dueDate;
    this.expiration_date = props.expirationDate;
    this.created_at = props.createdAt;
  }
}

/**
 * User pix payments controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Deposits')
@ApiBearerAuth()
@DefaultApiHeaders()
@TransactionApiHeader()
@Controller('pix/deposits/qr-codes/dynamic/due-date')
@HasPermission('api-paas-post-pix-deposits-qr-codes-dynamic-due-date')
export class CreateQrCodeDynamicDueDateRestController {
  /**
   * create a dynamic QRCode endpoint with Due Date.
   */
  @ApiOperation({
    summary: 'Create new dynamic Due Date QR Code.',
    description:
      'Enter the pix billing information on the requisition body below and execute to get a new dynamic QR Code.',
  })
  @ApiCreatedResponse({
    description: 'The created Due Date QR Code returned successfully.',
    type: CreateQrCodeDynamicDueDateRestResponse,
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
    @AuthUserParam() user: AuthUser,
    @KafkaServiceParam(CreateQrCodeDynamicDueDateServiceKafka)
    createService: CreateQrCodeDynamicDueDateServiceKafka,
    @LoggerParam(CreateQrCodeDynamicDueDateRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
    @Body() body: CreateQrCodeDynamicDueDateBody,
  ): Promise<CreateQrCodeDynamicDueDateRestResponse> {
    const payload: CreateQrCodeDynamicDueDateRequest = {
      userId: user.uuid,
      id: transactionId,
      key: body.key,
      documentValue: body.document_value,
      dueDate: body.due_date,
      summary: body.summary,
      description: body.description,
      allowUpdate: false,
      allowUpdateChange: false,
      allowUpdateWithdrawal: false,
      expirationDate:
        body.expiration_date &&
        getMoment(body.expiration_date).endOf('day').toDate(),
      payerEmail: body.payer_email,
      payerCity: body.payer_city,
      payerPersonType: body.payer_person_type,
      payerDocument: body.payer_document,
      payerAddress: body.payer_address,
      payerPhone: body.payer_phone,
      payerName: body.payer_name,
      payerRequest: body.payer_request,
    };

    logger.debug('Create qrCodeDynamicDueDate.', { user, payload });

    // Call create qrCodeDynamicDueDate service.
    const result = await createService.execute(payload);

    logger.debug('QrCodeDynamicDueDate created.', { result });

    const response = new CreateQrCodeDynamicDueDateRestResponse(result);

    return response;
  }
}
