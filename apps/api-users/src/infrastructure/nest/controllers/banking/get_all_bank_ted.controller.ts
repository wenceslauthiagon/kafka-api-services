import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
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
import {
  GetAllBankTedResponseItem,
  GetAllBankTedResponse,
  GetAllBankTedRequest,
  GetAllBankTedRequestSort,
} from '@zro/banking/interface';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetAllBankTedServiceKafka } from '@zro/banking/infrastructure';

class GetAllBankTedParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllBankTedRequestSort,
  })
  @IsOptional()
  @Sort(GetAllBankTedRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description:
      'Search filter. This filter is used to search for bank ted name and ispb.',
    minLength: 1,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  search?: string;
}

class GetAllBankTedRestResponseItem {
  @ApiProperty({
    description: 'Bank ted ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'Bank ted code.',
    example: '237',
  })
  code: string;

  @ApiProperty({
    description: 'Bank ted ispb.',
    example: '7219',
  })
  ispb: string;

  @ApiProperty({
    description: 'Bank ted name.',
    example: 'Bank ted Name S.A.',
  })
  name: string;

  @ApiProperty({
    description: 'Bank ted full name.',
    example: 'Bank ted Name of Money.',
  })
  full_name: string;

  @ApiProperty({
    description: 'Bank ted created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetAllBankTedResponseItem) {
    this.id = props.id;
    this.code = props.code;
    this.ispb = props.ispb;
    this.name = props.name;
    this.full_name = props.fullName;
    this.created_at = props.createdAt;
  }
}

class GetAllBankTedRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'BankTeds data.',
    type: [GetAllBankTedRestResponseItem],
  })
  data: GetAllBankTedRestResponseItem[];

  constructor(props: GetAllBankTedResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllBankTedRestResponseItem(item),
    );
  }
}

/**
 * BankTeds controller. Controller is protected by JWT access token.
 */
@ApiTags('Banking')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('banking/ted/banks')
@HasPermission('api-users-get-banking-ted-banks')
export class GetAllBankTedRestController {
  /**
   * get bank endpoint.
   */
  @ApiOperation({
    summary: 'List the banks.',
    description: 'List the banks.',
  })
  @ApiOkResponse({
    description: 'The banks returned successfully.',
    type: GetAllBankTedRestResponse,
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
    @KafkaServiceParam(GetAllBankTedServiceKafka)
    getAllService: GetAllBankTedServiceKafka,
    @LoggerParam(GetAllBankTedRestController)
    logger: Logger,
    @Query() params: GetAllBankTedParams,
  ): Promise<GetAllBankTedRestResponse> {
    // GetAll a payload.
    const payload: GetAllBankTedRequest = {
      page: params.page,
      pageSize: params.size,
      sort: params.sort,
      order: params.order,
      search: params.search,
      active: true, // Always get active banks
    };

    logger.debug('GetAll banksTed.', { user, payload });

    // Call get banksTed service.
    const result = await getAllService.execute(payload);

    logger.debug('BankTeds found.', { result });

    const response = new GetAllBankTedRestResponse(result);

    return response;
  }
}
