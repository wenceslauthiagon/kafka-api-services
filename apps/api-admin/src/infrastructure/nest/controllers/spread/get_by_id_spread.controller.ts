import { Logger } from 'winston';
import { Controller, Param, Get } from '@nestjs/common';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { RequestId, InjectLogger } from '@zro/common';
import {
  GetSpreadByIdRequest,
  GetSpreadByIdResponse,
} from '@zro/otc/interface';
import {
  GetSpreadByIdServiceKafka,
  AuthAdminParam,
} from '@zro/api-admin/infrastructure';
import { AuthAdmin } from '@zro/api-admin/domain';

export class GetSpreadByIdParams {
  @ApiProperty({
    description: 'Spread ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

export class GetSpreadByIdRestResponse {
  @ApiProperty({
    description: 'Spread ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Spread buy.',
    example: '1',
  })
  buy!: number;

  @ApiProperty({
    description: 'Spread sell.',
    example: '1',
  })
  sell!: number;

  @ApiProperty({
    description: 'Spread amount.',
    example: '1',
  })
  amount!: number;

  @ApiProperty({
    description: 'Spread created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: GetSpreadByIdResponse) {
    this.id = props.id;
    this.buy = props.buy;
    this.sell = props.sell;
    this.amount = props.amount;
    this.created_at = props.createdAt;
  }
}

/**
 * Spreads controller. Controller is protected by JWT access token.
 */
@ApiTags('Spread')
@ApiBearerAuth()
@Controller('quotations/spreads/:id')
export class GetSpreadByIdRestController {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param getByIdService create microservice.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly getByIdService: GetSpreadByIdServiceKafka,
  ) {
    this.logger = logger.child({
      context: GetSpreadByIdRestController.name,
    });
  }

  /**
   * get spread endpoint.
   */
  @ApiOperation({
    summary: 'Get a spread by id.',
    description: 'Get spread by id.',
  })
  @ApiOkResponse({
    description: 'The spread returned successfully.',
    type: GetSpreadByIdRestResponse,
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
    @Param() params: GetSpreadByIdParams,
  ): Promise<GetSpreadByIdRestResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    // GetById a payload.
    const payload: GetSpreadByIdRequest = {
      id: params.id,
    };

    logger.debug('GetById spread.', { admin, payload });

    // Call create spread service.
    const result = await this.getByIdService.execute(requestId, payload);

    logger.debug('Spread found.', { result });

    const response = new GetSpreadByIdRestResponse(result);

    return response;
  }
}
