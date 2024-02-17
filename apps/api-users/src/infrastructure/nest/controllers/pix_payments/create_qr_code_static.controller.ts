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
  IsUUID,
  IsString,
  IsOptional,
  IsPositive,
  MaxLength,
  IsInt,
} from 'class-validator';
import {
  KafkaServiceParam,
  LoggerParam,
  SanitizeHtml,
  DefaultApiHeaders,
  HasPermission,
  RequestTransactionId,
  TransactionApiHeader,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { QrCodeStaticState } from '@zro/pix-payments/domain';
import {
  CreateQrCodeStaticRequest,
  CreateQrCodeStaticResponse,
} from '@zro/pix-payments/interface';
import { AuthUserParam } from '@zro/users/infrastructure';
import { CreateQrCodeStaticServiceKafka } from '@zro/pix-payments/infrastructure';

class CreateQrCodeStaticBody {
  @ApiProperty({
    description: 'Associated key UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  key_id: string;

  @ApiPropertyOptional({
    description: 'Value in R$ cents.',
    example: 2300,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  value?: number;

  @ApiPropertyOptional({
    description: 'User friendly QR code identifier.',
    example: 'party-payment',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  summary?: string;

  @ApiPropertyOptional({
    description: 'User defined payment description.',
    example: 'User defined description',
  })
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(64)
  description?: string;
}

class CreateQrCodeStaticRestResponse {
  @ApiProperty({
    description: 'Qr code ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'PIX txID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  txid: string;

  @ApiPropertyOptional({
    description: 'EMV code.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  emv?: string;

  @ApiProperty({
    description: 'Associated key UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  key_id: string;

  @ApiPropertyOptional({
    description: 'Value in R$ cents.',
    example: 1299,
  })
  value?: number;

  @ApiPropertyOptional({
    description: 'User defined payment ID.',
    example: 'party-payment',
  })
  summary?: string;

  @ApiPropertyOptional({
    description: 'User defined payment description.',
    example: 'User defined description',
  })
  description?: string;

  @ApiProperty({
    enum: QrCodeStaticState,
    description: 'Qr code state.',
    example: QrCodeStaticState.PENDING,
  })
  state: QrCodeStaticState;

  @ApiProperty({
    description: 'Qr code created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: CreateQrCodeStaticResponse) {
    this.id = props.id;
    this.key_id = props.keyId;
    this.emv = props.emv;
    this.txid = props.txId;
    this.value = props.documentValue;
    this.summary = props.summary;
    this.description = props.description;
    this.state = props.state;
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
@Controller('pix/deposits/qr-codes')
@HasPermission('api-users-post-pix-deposits-qr-codes')
export class CreateQrCodeStaticRestController {
  /**
   * create qrCodeStatic endpoint.
   */
  @ApiOperation({
    summary: 'Create a static QR Code.',
    description: 'Create a static QR Code.',
  })
  @ApiCreatedResponse({
    description: 'The static QR Code returned successfully.',
    type: CreateQrCodeStaticRestResponse,
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
    @KafkaServiceParam(CreateQrCodeStaticServiceKafka)
    createService: CreateQrCodeStaticServiceKafka,
    @LoggerParam(CreateQrCodeStaticRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
    @Body() body: CreateQrCodeStaticBody,
  ): Promise<CreateQrCodeStaticRestResponse> {
    // Create a payload.
    const payload: CreateQrCodeStaticRequest = {
      userId: user.uuid,
      id: transactionId,
      keyId: body.key_id,
      documentValue: body.value,
      summary: body.summary,
      description: body.description,
    };

    logger.debug('Create qrCodeStatic.', { user, payload });

    // Call create qrCodeStatic service.
    const result = await createService.execute(payload);

    logger.debug('QrCodeStatic created.', result);

    const response = new CreateQrCodeStaticRestResponse(result);

    return response;
  }
}
