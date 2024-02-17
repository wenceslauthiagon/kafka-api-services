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
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  RequestId,
  Sort,
  InjectLogger,
} from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import {
  GetAllSystemResponseItem,
  GetAllSystemResponse,
  GetAllSystemRequest,
  GetAllSystemRequestSort,
} from '@zro/otc/interface';
import {
  AuthAdminParam,
  GetAllSystemServiceKafka,
} from '@zro/api-admin/infrastructure';

export class GetAllSystemParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllSystemRequestSort,
  })
  @IsOptional()
  @Sort(GetAllSystemRequestSort)
  sort?: PaginationSort;
}

class GetAllSystemRestResponseItem {
  @ApiProperty({
    description: 'System ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'System name.',
    example: 'USD',
  })
  name!: string;

  @ApiProperty({
    description: 'System description.',
  })
  description!: string;

  @ApiProperty({
    description: 'System created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: GetAllSystemResponseItem) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.created_at = props.createdAt;
  }
}

export class GetAllSystemRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Systems data.',
    type: [GetAllSystemRestResponseItem],
  })
  data!: GetAllSystemRestResponseItem[];

  constructor(props: GetAllSystemResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllSystemRestResponseItem(item),
    );
  }
}

/**
 * Systems controller. Controller is protected by JWT access token.
 */
@ApiTags('System')
@ApiBearerAuth()
@Controller('otc/systems')
export class GetAllSystemRestController {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param getAllService get microservice.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly getAllService: GetAllSystemServiceKafka,
  ) {
    this.logger = logger.child({ context: GetAllSystemRestController.name });
  }

  /**
   * get system endpoint.
   */
  @ApiOperation({
    summary: 'List the systems.',
    description: 'List the systems.',
  })
  @ApiOkResponse({
    description: 'The systems returned successfully.',
    type: GetAllSystemRestResponse,
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
    @Query() params: GetAllSystemParams,
  ): Promise<GetAllSystemRestResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    // GetAll a payload.
    const payload: GetAllSystemRequest = {
      page: params.page,
      pageSize: params.size,
      sort: params.sort,
      order: params.order,
    };

    logger.debug('GetAll systems.', { admin });

    // Call get system service.
    const result = await this.getAllService.execute(requestId, payload);

    logger.debug('Systems found.', { result });

    const response = new GetAllSystemRestResponse(result);

    return response;
  }
}
