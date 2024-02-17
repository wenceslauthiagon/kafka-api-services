import { Logger } from 'winston';
import { Controller, Body, Post } from '@nestjs/common';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsString,
  ArrayMinSize,
  ValidateNested,
  IsPositive,
} from 'class-validator';
import { InjectLogger, RequestId } from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { CreateSpreadRequest, CreateSpreadResponse } from '@zro/otc/interface';
import {
  CreateSpreadServiceKafka,
  AuthAdminParam,
} from '@zro/api-admin/infrastructure';

class CreateSpreadItem {
  @ApiProperty({
    description: 'Spread buy.',
    example: '1',
  })
  @IsNumber()
  @IsPositive()
  buy!: number;

  @ApiProperty({
    description: 'Spread sell.',
    example: '1',
  })
  @IsNumber()
  @IsPositive()
  sell!: number;

  @ApiProperty({
    description: 'Spread amount.',
    example: '1',
  })
  @IsPositive()
  @IsNumber()
  amount!: number;
}

class CreateSpreadBody {
  @ApiProperty({
    description: 'Spread source symbol.',
    example: 'USD',
  })
  @IsString()
  sourceSymbol!: string;

  @ApiProperty({
    description: 'Spread items.',
    type: [CreateSpreadItem],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSpreadItem)
  items!: CreateSpreadItem[];
}

class CreateSpreadRestResponse {
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

  constructor(props: CreateSpreadResponse) {
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
@Controller('quotations/spreads')
export class CreateSpreadRestController {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param createService create microservice.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly createService: CreateSpreadServiceKafka,
  ) {
    this.logger = logger.child({
      context: CreateSpreadRestController.name,
    });
  }

  /**
   * create spread endpoint.
   */
  @ApiOperation({
    summary: 'Add new spreads.',
    description: 'Add new spreads. Return the created spreads.',
  })
  @ApiCreatedResponse({
    description: 'The spreads returned successfully.',
    type: [CreateSpreadRestResponse],
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
  @Post()
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @RequestId() requestId: string,
    @Body() body: CreateSpreadBody,
  ): Promise<CreateSpreadRestResponse[]> {
    const logger = this.logger.child({ loggerId: requestId });

    // Create a payload.
    const payload: CreateSpreadRequest = {
      currencySymbol: body.sourceSymbol,
      items: body.items,
    };

    logger.debug('Create spreads.', { admin, payload });

    // Call create spread service.
    const result = await this.createService.execute(requestId, payload);

    logger.debug('Spreads created.', { result });

    const response = result.map((item) => new CreateSpreadRestResponse(item));

    return response;
  }
}
