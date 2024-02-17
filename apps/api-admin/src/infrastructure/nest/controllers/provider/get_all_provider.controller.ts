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
  InjectLogger,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  RequestId,
  Sort,
} from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import {
  GetAllProviderResponseItem,
  GetAllProviderResponse,
  GetAllProviderRequest,
  GetAllProviderRequestSort,
} from '@zro/otc/interface';
import {
  AuthAdminParam,
  GetAllProviderServiceKafka,
} from '@zro/api-admin/infrastructure';

export class GetAllProviderParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllProviderRequestSort,
  })
  @IsOptional()
  @Sort(GetAllProviderRequestSort)
  sort?: PaginationSort;
}

class GetAllProviderRestResponseItem {
  @ApiProperty({
    description: 'Provider ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Provider name.',
    example: 'USD',
  })
  name!: string;

  @ApiProperty({
    description: 'Provider description.',
  })
  description!: string;

  @ApiProperty({
    description: 'Provider created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: GetAllProviderResponseItem) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.created_at = props.createdAt;
  }
}

export class GetAllProviderRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Providers data.',
    type: [GetAllProviderRestResponseItem],
  })
  data!: GetAllProviderRestResponseItem[];

  constructor(props: GetAllProviderResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllProviderRestResponseItem(item),
    );
  }
}

/**
 * Providers controller. Controller is protected by JWT access token.
 */
@ApiTags('Provider')
@ApiBearerAuth()
@Controller('otc/providers')
export class GetAllProviderRestController {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param getAllService get microservice.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly getAllService: GetAllProviderServiceKafka,
  ) {
    this.logger = logger.child({
      context: GetAllProviderRestController.name,
    });
  }

  /**
   * get provider endpoint.
   */
  @ApiOperation({
    summary: 'List the providers.',
    description: 'List the providers.',
  })
  @ApiOkResponse({
    description: 'The providers returned successfully.',
    type: GetAllProviderRestResponse,
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
    @Query() params: GetAllProviderParams,
  ): Promise<GetAllProviderRestResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    // GetAll a payload.
    const payload: GetAllProviderRequest = {
      page: params.page,
      pageSize: params.size,
      sort: params.sort,
      order: params.order,
    };

    logger.debug('GetAll providers.', { admin });

    // Call get provider service.
    const result = await this.getAllService.execute(requestId, payload);

    logger.debug('Providers found.', { result });

    const response = new GetAllProviderRestResponse(result);

    return response;
  }
}
