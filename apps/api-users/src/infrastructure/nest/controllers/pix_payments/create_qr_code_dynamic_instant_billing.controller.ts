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
  IsInt,
} from 'class-validator';
import {
  LoggerParam,
  SanitizeHtml,
  KafkaServiceParam,
  IsIsoStringDateFormat,
  IsDateAfterThanNow,
  DefaultApiHeaders,
  HasPermission,
  RequestTransactionId,
  TransactionApiHeader,
  getMoment,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { PixQrCodeDynamicState } from '@zro/pix-payments/domain';
import { CreateQrCodeDynamicServiceKafka } from '@zro/pix-payments/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  CreateQrCodeDynamicInstantBillingRequest,
  CreateQrCodeDynamicInstantBillingResponse,
} from '@zro/pix-payments/interface';

class CreateQrCodeDynamicInstantBillingBody {
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
  @IsInt()
  document_value: number;

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
  @MaxLength(140)
  summary?: string;

  @ApiProperty({
    description: 'User defined payment description.',
    example: 'The party payment.',
  })
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  description: string;

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

export class CreateQrCodeDynamicInstantBillingRestResponse {
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
    description: 'Expiration date to pay qrCode.',
  })
  expiration_date?: Date;

  @ApiProperty({
    description: 'Qr code created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: CreateQrCodeDynamicInstantBillingResponse) {
    this.id = props.id;
    this.key_id = props.keyId;
    this.summary = props.summary;
    this.description = props.description;
    this.state = props.state;
    this.created_at = props.createdAt;
    this.expiration_date = props.expirationDate;
  }
}

/**
 * User pix payments controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Deposits')
@ApiBearerAuth()
@DefaultApiHeaders()
@TransactionApiHeader()
@Controller('pix/deposits/qr-codes/dynamic/instant-billing')
@HasPermission('api-users-post-pix-deposits-qr-codes-dynamic-instant-billing')
export class CreateQrCodeDynamicInstantBillingRestController {
  /**
   * Create instant billing dynamic QRCode endpoint.
   */
  @ApiOperation({
    summary: 'Create a instant billing dynamic QR Code.',
    description: 'Create a instant billing dynamic QR Code.',
  })
  @ApiCreatedResponse({
    description: 'The created QR Code returned successfully.',
    type: CreateQrCodeDynamicInstantBillingRestResponse,
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
    @KafkaServiceParam(CreateQrCodeDynamicServiceKafka)
    createService: CreateQrCodeDynamicServiceKafka,
    @LoggerParam(CreateQrCodeDynamicInstantBillingRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
    @Body() body: CreateQrCodeDynamicInstantBillingBody,
  ): Promise<CreateQrCodeDynamicInstantBillingRestResponse> {
    // Create a payload.
    const payload: CreateQrCodeDynamicInstantBillingRequest = {
      userId: user.uuid,
      id: transactionId,
      key: body.key,
      documentValue: body.document_value,
      summary: body.summary,
      allowUpdate: false,
      description: body.description,
      expirationDate:
        body.expiration_date &&
        getMoment(body.expiration_date).endOf('day').toDate(),
      payerRequest: body.payer_request,
    };

    logger.debug('Create qrCodeDynamic.', { user, payload });

    // Call create qrCodeDynamic service.
    const result = await createService.execute(payload);

    logger.debug('QrCodeDynamic created.', { result });

    const response = new CreateQrCodeDynamicInstantBillingRestResponse(result);

    return response;
  }
}
