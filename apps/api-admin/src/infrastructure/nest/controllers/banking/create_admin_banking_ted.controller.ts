import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { KafkaServiceParam, LoggerParam, SanitizeHtml } from '@zro/common';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { CreateAdminBankingTedServiceKafka } from '@zro/banking/infrastructure';
import {
  CreateAdminBankingTedRequest,
  CreateAdminBankingTedResponse,
} from '@zro/banking/interface';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { AdminBankingTedState } from '@zro/banking/domain';

export class CreateBankingTedBody {
  @ApiProperty({
    description: 'Source admin account ID.',
    example: '0a5c6a43-d7d4-4635-9075-c9a5aaf24a44',
  })
  @IsUUID()
  source_id: string;

  @ApiProperty({
    description: 'Destination admin account ID.',
    example: '23bf3d55-b336-4ca2-be4b-4b8df3cdd94a',
  })
  @IsUUID()
  destination_id: string;

  @ApiProperty({
    description: 'Admin banking TED amount in coins.',
    example: 10000,
  })
  @IsInt()
  @IsPositive()
  value: number;

  @ApiProperty({
    description: 'Admin banking TED description.',
    example: 'description',
  })
  @IsString()
  @MaxLength(255)
  @SanitizeHtml()
  description: string;
}

export class CreateAdminBankingTedRestResponse {
  @ApiProperty({
    description: 'AdminBankingTed ID.',
    example: '295564a9-c5fd-4e73-9abb-72e0383f2dfb',
  })
  id!: string;

  @ApiProperty({
    description: 'AdminBankingTed State.',
    example: AdminBankingTedState.PENDING,
  })
  state!: AdminBankingTedState;

  @ApiProperty({
    description: 'AdminBankingTed created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: CreateAdminBankingTedResponse) {
    this.id = props.id;
    this.state = props.state;
    this.created_at = props.createdAt;
  }
}

/**
 * Create admin banking ted controller. Controller is protected by admin JWT access token.
 */
@ApiTags('Banking')
@ApiBearerAuth()
@Controller('banking/ted')
export class CreateAdminBankingTedRestController {
  /**
   * Create admin banking TED endpoint.
   */
  @ApiOperation({
    description: 'Create admin banking TED.',
  })
  @ApiOkResponse({
    description: 'Ted has been successfully created.',
    type: CreateAdminBankingTedRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Admin authentication failed.',
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
  @HttpCode(HttpStatus.OK)
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @KafkaServiceParam(CreateAdminBankingTedServiceKafka)
    createAdminBankingTedService: CreateAdminBankingTedServiceKafka,
    @LoggerParam(CreateAdminBankingTedRestController)
    logger: Logger,
    @Body() body: CreateBankingTedBody,
  ): Promise<CreateAdminBankingTedRestResponse> {
    // Create a payload.
    const payload: CreateAdminBankingTedRequest = {
      id: uuidV4(),
      adminId: admin.id,
      sourceId: body.source_id,
      destinationId: body.destination_id,
      value: body.value,
      description: body.description,
    };

    logger.debug('Create admin banking ted.', { admin, payload });

    // Call update bank service.
    const result = await createAdminBankingTedService.execute(payload);

    logger.debug('Created admin banking ted.', { result });

    const response = new CreateAdminBankingTedRestResponse(result);

    return response;
  }
}
