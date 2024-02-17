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
  IsEmail,
} from 'class-validator';
import {
  KafkaServiceParam,
  LoggerParam,
  SanitizeHtml,
  IsCpfOrCnpj,
} from '@zro/common';
import { AuthCompany } from '@zro/pix-zro-pay/domain';
import {
  CreateQrCodeRequest,
  CreateQrCodeResponse,
} from '@zro/pix-zro-pay/interface';
import {
  AuthCompanyParam,
  CreateQrCodeServiceKafka,
} from '@zro/pix-zro-pay/infrastructure';

class CreateQrCodeBody {
  @ApiProperty({
    description: 'QrCode value.',
    example: 1245,
  })
  @IsInt()
  @IsPositive()
  value: number;

  @ApiPropertyOptional({
    description: 'User defined qrCode description.',
    example: 'Cobrança de deposito',
  })
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(80)
  description?: string;

  @ApiPropertyOptional({
    description: 'Client name identifier.',
    example: 'Johnny',
  })
  @IsOptional()
  @IsString()
  client_name?: string;

  @ApiPropertyOptional({
    description: 'Client email identifier.',
    example: 'client@email.com',
  })
  @IsOptional()
  @IsEmail()
  client_email?: string;

  @ApiProperty({
    description: 'Client document identifier.',
    example: '80064671020',
  })
  @IsCpfOrCnpj()
  client_document: string;

  @ApiProperty({
    description: 'Merchant ID for identify who solicitate QrCode.',
    example: '271e4016-47de-45e0-9340-6f2560ce3a90',
  })
  @IsUUID(4)
  merchant_id: string;

  @ApiPropertyOptional({
    description: 'Time in seconds for expire qrCode.',
    example: 600,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  expiration_in_seconds?: number;
}

class CreateQrCodeRestResponse {
  @ApiProperty({
    description: 'TransactionUUID QrCode.',
    example: '972a5f62-9e8b-4c9e-b741-401325449f12',
  })
  transaction_uuid: string;

  @ApiProperty({
    description: 'EMV QrCode.',
    example:
      '00020101021126330014br.gov.bcb.pix0111082853887515204000053039865406100.005802BR5912API DE TESTE6009SAO PAULO620605022163045927',
  })
  qr_code: string;

  @ApiProperty({
    description: 'Merchant ID for identify who solicitate QrCode.',
    example: '271e4016-47de-45e0-9340-6f2560ce3a90',
  })
  merchant_id: string;

  constructor(props: CreateQrCodeResponse) {
    this.transaction_uuid = props.transactionUuid;
    this.qr_code = props.emv;
    this.merchant_id = props.merchantId;
  }
}

/**
 * User pix zro-pay controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | QrCodes')
@ApiBearerAuth()
@Controller('pix/qr-codes')
export class CreateQrCodeRestController {
  /**
   * create qrCode endpoint.
   */
  @ApiOperation({
    summary: 'Create a QR Code.',
    description: 'Create a QR Code.',
  })
  @ApiCreatedResponse({
    description: 'The QR Code returned successfully.',
    type: CreateQrCodeRestResponse,
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
    @KafkaServiceParam(CreateQrCodeServiceKafka)
    createService: CreateQrCodeServiceKafka,
    @LoggerParam(CreateQrCodeRestController)
    logger: Logger,
    @Body() body: CreateQrCodeBody,
  ): Promise<CreateQrCodeRestResponse> {
    // Create a payload.
    const payload: CreateQrCodeRequest = {
      value: body.value,
      companyId: company.id,
      merchantId: body.merchant_id,
      clientDocument: body.client_document,
      description: body.description,
      clientName: body.client_name,
      clientEmail: body.client_email,
      expirationInSeconds: body.expiration_in_seconds,
    };

    logger.debug('Create qrCode.', { company, payload });

    // Call create qrCode service.
    const result = await createService.execute(payload);

    logger.debug('QrCode created.', result);

    const response = new CreateQrCodeRestResponse(result);

    return response;
  }
}
