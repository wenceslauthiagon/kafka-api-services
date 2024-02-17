import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
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
  RequestId,
  PaginationParams,
  PaginationRestResponse,
  IsIsoStringDateFormat,
  IsDateAfterThan,
  IsDateBeforeThan,
  Sort,
  PaginationSort,
  InjectLogger,
} from '@zro/common';
import { KeyState, KeyType } from '@zro/pix-keys/domain';
import { AuthAdmin } from '@zro/api-admin/domain';
import {
  GetHistoryPixKeyRequest,
  GetHistoryPixKeyResponse,
  GetHistoryPixKeyRequestSort,
  GetHistoryPixKeyResponseItem,
} from '@zro/pix-keys/interface';
import {
  pixKeyTypeRest,
  pixKeyStateRest,
  GetHistoryPixKeyServiceKafka,
  AuthAdminParam,
} from '@zro/api-admin/infrastructure';

export class GetHistoryPixKeyParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetHistoryPixKeyRequestSort,
  })
  @IsOptional()
  @Sort(GetHistoryPixKeyRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description: 'Pix key ID.',
  })
  @IsOptional()
  @IsUUID(4)
  pix_key_id?: string;

  @ApiPropertyOptional({
    description: 'Pix key.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(77)
  key?: string;

  @ApiPropertyOptional(pixKeyTypeRest)
  @IsOptional()
  @IsEnum(KeyType)
  type?: KeyType;

  @ApiPropertyOptional(pixKeyStateRest)
  @IsOptional()
  @IsEnum(KeyState)
  state?: KeyState;

  @ApiPropertyOptional({
    description: 'User id.',
  })
  @IsOptional()
  @IsUUID(4)
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Created date start range history pix key.',
    format: 'YYYY-MM-DDTHH:mm:ss',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss', {
    message: 'Invalid format date createdAtStart',
  })
  @IsDateBeforeThan('created_at_end', false, {
    message: 'CreatedAtStart must be before than CreateadAtEnd',
  })
  created_at_start?: Date;

  @ApiPropertyOptional({
    description: 'Created date end range history pix key.',
    format: 'YYYY-MM-DDTHH:mm:ss',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss', {
    message: 'Invalid format date createdAtEnd',
  })
  @IsDateAfterThan('created_at_start', false, {
    message: 'CreatedAtEnd must be after than CreateadAtStart',
  })
  created_at_end?: Date;

  @ApiPropertyOptional({
    description: 'Updated date start range history pix key.',
    format: 'YYYY-MM-DDTHH:mm:ss',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss', {
    message: 'Invalid format date updatedAtStart',
  })
  @IsDateBeforeThan('updated_at_end', false, {
    message: 'UpdatedAtStart must be before than UpdatedAtEnd',
  })
  updated_at_start?: Date;

  @ApiPropertyOptional({
    description: 'Updated date end range history pix key.',
    format: 'YYYY-MM-DDTHH:mm:ss',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss', {
    message: 'Invalid format date updatedAtEnd',
  })
  @IsDateAfterThan('updated_at_start', false, {
    message: 'UpdatedAtEnd must be after than UpdatedAtStart',
  })
  updated_at_end?: Date;
}

class GetHistoryPixKeyRestResponseItem {
  @ApiProperty({
    description: 'History ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Pix key ID.',
    example: '8a18bbb5-5c0b-4f4d-830b-5f95b474e73d',
  })
  pix_key_id!: string;

  @ApiProperty({
    description: 'Pix key.',
    example: 'a0e572a3-81dc-4580-bbbc-2e0e909e4a9b',
  })
  key!: string;

  @ApiProperty(pixKeyTypeRest)
  type!: KeyType;

  @ApiProperty(pixKeyStateRest)
  state!: KeyState;

  @ApiProperty({
    description: 'History created at.',
    example: new Date(),
  })
  created_at!: Date;

  @ApiProperty({
    description: 'History updated at.',
    example: new Date(),
  })
  updated_at!: Date;

  @ApiProperty({
    description: 'User ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  user_id!: string;

  constructor(props: GetHistoryPixKeyResponseItem) {
    this.id = props.id;
    this.pix_key_id = props.pixKeyId;
    this.key = props.key;
    this.type = props.type;
    this.state = props.state;
    this.created_at = props.createdAt;
    this.updated_at = props.updatedAt;
    this.user_id = props.userId;
  }
}

export class GetHistoryPixKeyRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'History data.',
    type: [GetHistoryPixKeyRestResponseItem],
  })
  data!: GetHistoryPixKeyRestResponseItem[];

  constructor(props: GetHistoryPixKeyResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetHistoryPixKeyRestResponseItem(item),
    );
  }
}

/**
 * Pix Key controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix Keys')
@ApiBearerAuth()
@Controller('pix/keys/history')
export class GetHistoryPixKeyRestController {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param getHistoryPixKeyService create microservice.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly getHistoryPixKeyService: GetHistoryPixKeyServiceKafka,
  ) {
    this.logger = logger.child({
      context: GetHistoryPixKeyRestController.name,
    });
  }

  /**
   * get pixKey endpoint.
   */
  @ApiOperation({
    summary: 'Get a history pix key.',
    description: 'Get all pix key state history',
  })
  @ApiOkResponse({
    description:
      'The pix key returned successfully. Returns empty [] history not found.',
    type: GetHistoryPixKeyRestResponse,
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
    @RequestId() requestId: string,
    @Query() params: GetHistoryPixKeyParams,
  ): Promise<GetHistoryPixKeyRestResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    // Create a payload.
    const payload: GetHistoryPixKeyRequest = {
      pixKeyId: params.pix_key_id,
      pixKey: {
        key: params.key,
        type: params.type,
        userId: params.user_id,
      },
      createdAt: {
        start: params.created_at_start,
        end: params.created_at_end,
      },
      updatedAt: {
        start: params.updated_at_start,
        end: params.updated_at_end,
      },
      state: params.state,
      page: params.page,
      pageSize: params.size,
      sort: params.sort,
      order: params.order,
    };

    logger.debug('Getting a pixKeyHistory.', { admin, payload });

    // Call get pixKey service.
    const result = await this.getHistoryPixKeyService.execute(
      requestId,
      payload,
    );

    logger.debug('pixKeyHistory found.', { result });

    const response = new GetHistoryPixKeyRestResponse(result);

    return response;
  }
}
