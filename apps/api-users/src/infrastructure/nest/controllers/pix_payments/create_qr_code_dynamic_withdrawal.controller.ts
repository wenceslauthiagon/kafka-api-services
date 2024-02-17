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
  MaxLength,
  Length,
  IsEnum,
  IsNumberString,
  IsEmail,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';

import {
  IsCpfOrCnpj,
  IsIsoStringDateFormat,
  LoggerParam,
  SanitizeHtml,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser, PersonType } from '@zro/users/domain';
import { PixAgentMod, PixQrCodeDynamicState } from '@zro/pix-payments/domain';
import { AuthUserParam } from '@zro/users/infrastructure';

export class CreateQrCodeDynamicWithdrawalBody {
  @ApiProperty({
    description: 'Associated key UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  key_id: string;

  @ApiProperty({
    description: 'Value in R$ cents',
    example: 2300,
  })
  @IsInt()
  @Min(0)
  withdrawal_value: number;

  @ApiProperty({
    description: 'User friendly QR code identifier.',
    example: 'party-payment',
  })
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
  description?: string;

  @ApiPropertyOptional({
    description: 'Payer city (IBGE city code).',
    example: '2611606',
  })
  @IsOptional()
  @IsString()
  @Length(7, 7)
  payer_city?: string;

  @ApiPropertyOptional({
    description: `Person type:<br>
    <ul>
      <li>${PersonType.NATURAL_PERSON}.
      <li>${PersonType.LEGAL_PERSON}.
    </ul>`,
    example: PersonType.LEGAL_PERSON,
  })
  @IsOptional()
  @IsEnum(PersonType)
  payer_person_type?: PersonType;

  @ApiPropertyOptional({
    description: 'Payer document number.',
    example: '78762893041',
  })
  @IsOptional()
  @IsString()
  @IsNumberString()
  @IsCpfOrCnpj()
  payer_document?: string;

  @ApiPropertyOptional({
    description: 'Payer name.',
    example: 'Jonh Doe',
  })
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  payer_name?: string;

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

  @ApiProperty({
    description: 'This document value can be changed.',
  })
  @IsBoolean()
  allow_update: boolean;

  @ApiPropertyOptional({
    description: 'Payer request.',
    example: 'Send receipt to my email.',
  })
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  payer_request?: string;

  @ApiProperty({
    description: 'Withdrawal agent ISPB.',
    example: '7654321',
  })
  @IsString()
  @Length(7, 7)
  agent_ispb: string;

  @ApiProperty({
    description: `Agent mod:<br>
    <ul>
      <li>${PixAgentMod.AGTEC}: Agente Estabelecimento Comercial -- (Default).
      <li>${PixAgentMod.AGTOT}: Agente Outra Espécie de Pessoa Jurídica que tenha
      como atividade principal ou secundária a prestação de serviços auxiliares
      a serviços financeiros ou afins ou correspondente no País.
      <li>${PixAgentMod.AGPSS}: Agente Facilitador de Serviço de Saque.
    </ul>`,
    example: PixAgentMod.AGTEC,
  })
  @IsEnum(PixAgentMod)
  agent_mod: PixAgentMod;

  @ApiProperty({
    description: 'Expiration date.',
    format: 'YYYY-MM-DDTHH:mm:ss',
  })
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss')
  expiration_date: Date;
}

export class CreateQrCodeDynamicWithdrawalRestResponse {
  @ApiProperty({
    description: 'Qr code ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'PIX end-to-end ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  txid?: string;

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
    enum: PixQrCodeDynamicState,
    description: 'Qr code state.',
    example: PixQrCodeDynamicState.PENDING,
  })
  state: PixQrCodeDynamicState;

  @ApiProperty({
    description: 'Qr code created at.',
    example: new Date(),
  })
  created_at: Date;

  /*constructor(props: CreateQrCodeDynamicWithdrawalResponse) {
    this.id = props.id;
    this.key_id = props.keyId;
    this.emv = props.emv;
    this.txid = props.txId;
    this.summary = props.summary;
    this.description = props.description;
    this.state = props.state;
    this.created_at = props.createdAt;
  }*/
}

/**
 * User pix payments controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Deposits')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('pix/deposits/qr-codes/dynamic/withdrawal')
@HasPermission('api-users-post-pix-deposits-qr-codes-dynamic-withdrawal')
export class CreateQrCodeDynamicWithdrawalRestController {
  /**
   * create withdrawal dynamic QRCode endpoint.
   */
  @ApiOperation({
    summary: 'Create a withdrawal dynamic QR Code. (DO NOT WORKING YET)',
    description: 'Create a withdrawal dynamic QR Code.',
    deprecated: true,
  })
  @ApiCreatedResponse({
    description: 'The created QR Code returned successfully.',
    type: CreateQrCodeDynamicWithdrawalRestResponse,
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
    @LoggerParam(CreateQrCodeDynamicWithdrawalRestController)
    logger: Logger,
    @Body() body: CreateQrCodeDynamicWithdrawalBody,
  ): Promise<CreateQrCodeDynamicWithdrawalRestResponse> {
    logger.error('Not implemented', { user, body });

    return null;
    /* Create a payload.
    const payload: CreateQrCodeStaticRequest = {
      userId: user.uuid,
      id: uuidV4(),
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

    return response;*/
  }
}
