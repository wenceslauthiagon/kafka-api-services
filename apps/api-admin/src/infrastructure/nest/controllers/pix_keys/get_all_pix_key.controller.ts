import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional, IsUUID } from 'class-validator';
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
  InjectLogger,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  RequestId,
  Sort,
} from '@zro/common';
import { KeyState, KeyType } from '@zro/pix-keys/domain';
import {
  GetAllPixKeyRequest,
  GetAllPixKeyRequestSort,
  GetAllPixKeyResponse,
  GetAllPixKeyResponseItem,
} from '@zro/pix-keys/interface';
import {
  pixKeyTypeRest,
  pixKeyStateRest,
  GetAllPixKeyServiceKafka,
  AuthAdminParam,
} from '@zro/api-admin/infrastructure';
import { AuthAdmin } from '@zro/api-admin/domain';

export class GetAllPixKeyParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllPixKeyRequestSort,
  })
  @IsOptional()
  @Sort(GetAllPixKeyRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description: 'User id.',
  })
  @IsUUID(4)
  @IsOptional()
  user_id?: string;
}

class GetAllPixKeyRestResponseItem {
  @ApiProperty({
    description: 'Pix Key ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Pix key.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  key!: string;

  @ApiProperty(pixKeyTypeRest)
  type!: KeyType;

  @ApiProperty(pixKeyStateRest)
  state!: KeyState;

  @ApiProperty({
    description: 'Pix Key created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: GetAllPixKeyResponseItem) {
    this.id = props.id;
    this.key = props.key;
    this.type = props.type;
    this.state = props.state;
    this.created_at = props.createdAt;
  }
}

export class GetAllPixKeyRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'PixKeys data.',
    type: [GetAllPixKeyRestResponseItem],
  })
  data!: GetAllPixKeyRestResponseItem[];

  constructor(props: GetAllPixKeyResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllPixKeyRestResponseItem(item),
    );
  }
}

/**
 * Pix Key controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix Keys')
@ApiBearerAuth()
@Controller('pix/keys')
export class GetAllPixKeyRestController {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param getAllPixKeyService create microservice.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly getAllPixKeyService: GetAllPixKeyServiceKafka,
  ) {
    this.logger = logger.child({
      context: GetAllPixKeyRestController.name,
    });
  }

  /**
   * get pixKey endpoint.
   */
  @ApiOperation({
    summary: "List the user's keys.",
    description:
      'List all keys associated with the user account except canceled keys. Return a list of keys.',
  })
  @ApiOkResponse({
    description: 'The pix keys returned successfully.',
    type: GetAllPixKeyRestResponse,
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
    @Query() params: GetAllPixKeyParams,
  ): Promise<GetAllPixKeyRestResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    // Create a payload.
    const payload: GetAllPixKeyRequest = {
      userId: params.user_id,
      page: params.page,
      pageSize: params.size,
      sort: params.sort,
      order: params.order,
    };

    logger.debug('Getting all pixKey.', { admin, payload });

    // Call get pixKey service.
    const result = await this.getAllPixKeyService.execute(requestId, payload);

    logger.debug('PixKeys found.', { result });

    const response = new GetAllPixKeyRestResponse(result);

    return response;
  }
}
