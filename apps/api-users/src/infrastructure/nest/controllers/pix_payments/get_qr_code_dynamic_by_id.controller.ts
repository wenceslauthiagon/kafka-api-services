import { Controller, Param, Get } from '@nestjs/common';
import { Logger } from 'winston';
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
  DefaultApiHeaders,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { PixQrCodeDynamicState } from '@zro/pix-payments/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  GetQrCodeDynamicByIdRequest,
  GetQrCodeDynamicByIdResponse,
} from '@zro/pix-payments/interface';
import { GetQrCodeDynamicByIdServiceKafka } from '@zro/pix-payments/infrastructure';

export class GetQrCodeDynamicByIdParams {
  @ApiProperty({
    description: 'Qr Code UUID.',
  })
  @IsUUID(4)
  id!: string;
}

export class GetQrCodeDynamicByIdRestResponse {
  @ApiProperty({
    description: 'Qr code ID.',
    example: 'abf6c3c6-f54b-4fbf-83ee-75ecf5f36c66',
  })
  id: string;

  @ApiProperty({
    description: 'Qr code txID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  txid: string;

  @ApiProperty({
    description: 'EMV code.',
    example:
      '00020101021226910014br.gov.bcb.pix2569bankaddress.com.br/pix/v2/cob/8b358702141e4162bd68eedfe7fb45f4520400005303986540523.005802BR5924USER',
  })
  emv: string;

  @ApiProperty({
    description: 'Qr code expiration date.',
    example: new Date(),
  })
  expiration_date: Date;

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

  @ApiProperty({
    description: 'User defined qr code description.',
    example: 'Qr code to receive payment.',
  })
  description: string;

  @ApiProperty({
    enum: PixQrCodeDynamicState,
    description: 'Qr code state.',
    example: PixQrCodeDynamicState.READY,
  })
  state: PixQrCodeDynamicState;

  @ApiProperty({
    description: 'Qr code created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetQrCodeDynamicByIdResponse) {
    this.id = props.id;
    this.key_id = props.keyId;
    this.emv = props.emv;
    this.txid = props.txId;
    this.expiration_date = props.expirationDate;
    this.value = props.documentValue;
    this.description = props.description;
    this.state = props.state;
    this.created_at = props.createdAt;
  }
}

/**
 * User pix payments controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Deposits')
@Controller('pix/deposits/qr-codes/dynamic/:id')
@ApiBearerAuth()
@DefaultApiHeaders()
@HasPermission('api-users-get-pix-deposits-qr-codes-dynamic-by-id')
export class GetQrCodeDynamicByIdRestController {
  /**
   * get qr code dynamic by id endpoint.
   */
  @ApiOperation({
    summary: 'Get dynamic QR code by ID.',
    description:
      "Enter the pix dynamic QR code's ID below and execute to get its state and all information.",
  })
  @ApiOkResponse({
    description: 'The PIX Qr Code Dynamic returned successfully.',
    type: GetQrCodeDynamicByIdRestResponse,
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
    @Param() params: GetQrCodeDynamicByIdParams,
    @KafkaServiceParam(GetQrCodeDynamicByIdServiceKafka)
    service: GetQrCodeDynamicByIdServiceKafka,
    @LoggerParam(GetQrCodeDynamicByIdRestController)
    logger: Logger,
  ): Promise<GetQrCodeDynamicByIdRestResponse> {
    // Create a payload.
    const payload: GetQrCodeDynamicByIdRequest = {
      id: params.id,
      userId: user.uuid,
    };

    logger.debug('Get qr code dynamic by id.', { user, payload });

    // Call get qr code dynamic service.
    const result = await service.execute(payload);

    logger.debug('QrCodeDynamic result.', { result });

    const response = result && new GetQrCodeDynamicByIdRestResponse(result);

    return response;
  }
}
