import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional } from 'class-validator';
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
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  Sort,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { QrCodeStaticState } from '@zro/pix-payments/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  GetAllQrCodeStaticByUserResponseItem,
  GetAllQrCodeStaticByUserResponse,
  GetAllQrCodeStaticByUserRequest,
  GetAllQrCodeStaticByUserRequestSort,
} from '@zro/pix-payments/interface';
import { GetAllQrCodeStaticByUserServiceKafka } from '@zro/pix-payments/infrastructure';

class GetAllQrCodeStaticParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllQrCodeStaticByUserRequestSort,
  })
  @IsOptional()
  @Sort(GetAllQrCodeStaticByUserRequestSort)
  sort?: PaginationSort;
}

class GetAllQrCodeStaticRestResponseItem {
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

  @ApiPropertyOptional({
    description:
      'Expiration date to pay qrCode. <b>Max date is 3 months ahead.</b>',
    example: new Date(),
  })
  expiration_date?: Date;

  @ApiPropertyOptional({
    description:
      'If it is true, QrCode can be paid many times. <b>When it is false, expiration date is required.</b>',
    example: true,
  })
  payable_many_times?: boolean;

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

  constructor(props: GetAllQrCodeStaticByUserResponseItem) {
    this.id = props.id;
    this.key_id = props.keyId;
    this.emv = props.emv;
    this.txid = props.txId;
    this.value = props.documentValue;
    this.summary = props.summary;
    this.description = props.description;
    this.expiration_date = props.expirationDate;
    this.payable_many_times = props.payableManyTimes;
    this.state = props.state;
    this.created_at = props.createdAt;
  }
}

class GetAllQrCodeStaticRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'QrCodeStatics data.',
    type: [GetAllQrCodeStaticRestResponseItem],
  })
  data: GetAllQrCodeStaticRestResponseItem[];

  constructor(props: GetAllQrCodeStaticByUserResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllQrCodeStaticRestResponseItem(item),
    );
  }
}

/**
 * QrCodeStatics controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Deposits')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('pix/deposits/qr-codes/static')
@HasPermission('api-paas-get-pix-deposits-qr-codes')
export class GetAllQrCodeStaticRestController {
  /**
   * get qrCodeStatic endpoint.
   */
  @ApiOperation({
    summary: "List user's QR codes.",
    description: "Get a list of user's QR codes.",
  })
  @ApiOkResponse({
    description: 'The static QR Codes returned successfully.',
    type: GetAllQrCodeStaticRestResponse,
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
    @KafkaServiceParam(GetAllQrCodeStaticByUserServiceKafka)
    getAllService: GetAllQrCodeStaticByUserServiceKafka,
    @LoggerParam(GetAllQrCodeStaticRestController)
    logger: Logger,
    @Query() params: GetAllQrCodeStaticParams,
  ): Promise<GetAllQrCodeStaticRestResponse> {
    // GetAll a payload.
    const payload: GetAllQrCodeStaticByUserRequest = {
      userId: user.uuid,
      page: params.page,
      pageSize: params.size,
      sort: params.sort,
      order: params.order,
    };

    logger.debug('GetAll qrCodeStatics.', { user, payload });

    // Call get qrCodeStatic service.
    const result = await getAllService.execute(payload);

    logger.debug('QrCodeStatics found.', { result });

    const response = new GetAllQrCodeStaticRestResponse(result);

    return response;
  }
}
