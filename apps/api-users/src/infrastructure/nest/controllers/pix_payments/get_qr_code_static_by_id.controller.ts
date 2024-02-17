import { Logger } from 'winston';
import { Controller, Get, Param } from '@nestjs/common';
import { IsUUID } from 'class-validator';
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
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { QrCodeStaticState } from '@zro/pix-payments/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  GetByQrCodeStaticIdResponse,
  GetByQrCodeStaticIdRequest,
} from '@zro/pix-payments/interface';
import { GetByQrCodeStaticIdServiceKafka } from '@zro/pix-payments/infrastructure';

class GetByQrCodeStaticIdParams {
  @ApiProperty({
    description: "QR code's id.",
  })
  @IsUUID(4)
  id!: string;
}

class GetByQrCodeStaticIdRestResponse {
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
    example: 'The party payment.',
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

  constructor(props: GetByQrCodeStaticIdResponse) {
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
 * QrCodeStatics controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Deposits')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('pix/deposits/qr-codes/:id')
@HasPermission('api-users-get-pix-deposits-qr-codes-by-id')
export class GetByQrCodeStaticIdRestController {
  /**
   * get qrCodeStatic endpoint.
   */
  @ApiOperation({
    summary: "Get a user's QR code by id.",
    description: "Get user's QR code by id.",
  })
  @ApiOkResponse({
    description: 'Pix QR code found.',
    type: GetByQrCodeStaticIdRestResponse,
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
    @KafkaServiceParam(GetByQrCodeStaticIdServiceKafka)
    service: GetByQrCodeStaticIdServiceKafka,
    @LoggerParam(GetByQrCodeStaticIdRestController)
    logger: Logger,
    @Param() params: GetByQrCodeStaticIdParams,
  ): Promise<GetByQrCodeStaticIdRestResponse> {
    // GetById a payload.
    const payload: GetByQrCodeStaticIdRequest = {
      userId: user.uuid,
      id: params.id,
    };

    logger.debug('GetById qrCodeStatic.', { user, payload });

    // Call get qrCodeStatic service.
    const result = await service.execute(payload);

    logger.debug('QrCodeStatic found.', { result });

    const response = result && new GetByQrCodeStaticIdRestResponse(result);

    return response;
  }
}
