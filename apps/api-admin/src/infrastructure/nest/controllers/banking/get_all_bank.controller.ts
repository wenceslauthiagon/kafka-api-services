import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
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
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  Sort,
} from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import {
  GetAllBankResponseItem,
  GetAllBankResponse,
  GetAllBankRequest,
  GetAllBankRequestSort,
} from '@zro/banking/interface';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { GetAllBankServiceKafka } from '@zro/banking/infrastructure';

export class GetAllBankParams extends PaginationParams {
  /**
   *  The valid boolean values like string
   */
  private static VALID_BOOLEAN_VALUES = ['true', 'false'];

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

  @ApiPropertyOptional({
    enum: GetAllBankParams.VALID_BOOLEAN_VALUES,
    description: 'Bank active flag.',
  })
  @IsOptional()
  @IsEnum(GetAllBankParams.VALID_BOOLEAN_VALUES)
  active?: string;
}

class GetAllBankRestResponseItem {
  @ApiProperty({
    description: 'Bank ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Bank ispb.',
    example: '7219',
  })
  ispb!: string;

  @ApiProperty({
    description: 'Bank name.',
    example: 'Bank Name S.A.',
  })
  name!: string;

  @ApiProperty({
    description: 'Bank full name.',
    example: 'Bank Name of Money.',
  })
  full_name!: string;

  @ApiProperty({
    description: 'Bank active flag.',
    example: true,
  })
  active!: boolean;

  @ApiProperty({
    description: 'Bank created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: GetAllBankResponseItem) {
    this.id = props.id;
    this.ispb = props.ispb;
    this.name = props.name;
    this.full_name = props.fullName;
    this.active = props.active;
    this.created_at = props.createdAt;
  }
}

export class GetAllBankRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Banks data.',
    type: [GetAllBankRestResponseItem],
  })
  data!: GetAllBankRestResponseItem[];

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
@Controller('banking/banks')
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
    @AuthAdminParam() admin: AuthAdmin,
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
      ...(params.active && { active: params.active === 'true' }), // Parse the string to a valid boolean value
    };

    logger.debug('GetAll banks.', { admin, payload });

    // Call get bank service.
    const result = await getAllService.execute(payload);

    logger.debug('Banks found.', { result });

    const response = new GetAllBankRestResponse(result);

    return response;
  }
}
