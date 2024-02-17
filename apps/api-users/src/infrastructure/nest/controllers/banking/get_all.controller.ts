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
  GetAllBankResponseItem,
  GetAllBankResponse,
  GetAllBankRequest,
  GetAllBankRequestSort,
} from '@zro/banking/interface';
import { GetAllBankServiceKafka } from '@zro/banking/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';

class GetAllBankParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllBankRequestSort,
  })
  @IsOptional()
  @Sort(GetAllBankRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description:
      'Search filter. This filter is used to search for bank name and ispb.',
    example: 'My bank name',
    minLength: 1,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  search?: string;
}

class GetAllBankRestResponseItem {
  @ApiProperty({
    description: 'Bank ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'Bank ispb.',
    example: '7219',
  })
  ispb: string;

  @ApiProperty({
    description: 'Bank name.',
    example: 'Bank Name S.A.',
  })
  name: string;

  @ApiProperty({
    description: 'Bank full name.',
    example: 'Bank Name of Money.',
  })
  full_name: string;

  @ApiProperty({
    description: 'Bank created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetAllBankResponseItem) {
    this.id = props.id;
    this.ispb = props.ispb;
    this.name = props.name;
    this.full_name = props.fullName;
    this.created_at = props.createdAt;
  }
}

class GetAllBankRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Banks data.',
    type: [GetAllBankRestResponseItem],
  })
  data: GetAllBankRestResponseItem[];

  constructor(props: GetAllBankResponse) {
    super(props);
    this.data = props.data.map((item) => new GetAllBankRestResponseItem(item));
  }
}

/**
 * Banks controller. Controller is protected by JWT access token.
 */
@ApiTags('Banking')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('banking/banks')
@HasPermission('api-users-get-banking-banks')
export class GetAllBankRestController {
  /**
   * get bank endpoint.
   */
  @ApiOperation({
    summary: 'List the banks.',
    description: 'List the banks.',
  })
  @ApiOkResponse({
    description: 'The banks returned successfully.',
    type: GetAllBankRestResponse,
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
    @KafkaServiceParam(GetAllBankServiceKafka)
    getAllService: GetAllBankServiceKafka,
    @LoggerParam(GetAllBankRestController)
    logger: Logger,
    @Query() params: GetAllBankParams,
  ): Promise<GetAllBankRestResponse> {
    // GetAll a payload.
    const payload: GetAllBankRequest = {
      page: params.page,
      pageSize: params.size,
      sort: params.sort,
      order: params.order,
      search: params.search,
      active: true, // Always get active banks
    };

    logger.debug('GetAll banks.', { user, payload });

    // Call get bank service.
    const result = await getAllService.execute(payload);

    logger.debug('Banks found.', { result });

    const response = new GetAllBankRestResponse(result);

    return response;
  }
}
