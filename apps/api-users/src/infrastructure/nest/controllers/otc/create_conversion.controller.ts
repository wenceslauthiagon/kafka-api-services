import { Controller, Body, Post, UseGuards } from '@nestjs/common';
import { Logger } from 'winston';
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
import { IsUUID } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import {
  EnableReplayProtection,
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
  RequestTransactionId,
  TransactionApiHeader,
  MissingEnvVarException,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet } from '@zro/operations/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { AuthWalletParam } from '@zro/operations/infrastructure';
import { PinBody, PinGuard } from '@zro/api-users/infrastructure';
import { CreateConversionServiceKafka } from '@zro/otc/infrastructure';
import {
  CreateConversionRequest,
  CreateConversionResponse,
} from '@zro/otc/interface';

export class CreateConversionBody extends PinBody {
  @ApiProperty({
    description: 'Quotation ID to convert.',
    example: 'abb8e578-6540-4104-8fa9-90a854ab0d1c',
  })
  @IsUUID(4)
  quotation_id: string;
}

export class CreateConversionRestResponse {
  @ApiProperty({
    description: 'Conversion ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Operation ID conversion.',
    example: '295564a9-c5fd-4e73-9abb-72e0383f2dfb',
  })
  operation_id!: string;

  @ApiProperty({
    description: 'Pix Key created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: CreateConversionResponse) {
    this.id = props.id;
    this.operation_id = props.operationId;
    this.created_at = props.createdAt;
  }
}

interface CreateConversionConfig {
  APP_CONVERSION_SYSTEM: string;
}

/**
 * User pix keys controller. Controller is protected by JWT access token.
 */
@ApiTags('Otc | Conversions')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('conversions')
@UseGuards(PinGuard)
@TransactionApiHeader()
@EnableReplayProtection()
@HasPermission('api-users-post-conversions')
export class CreateConversionRestController {
  private readonly conversionSystemName: string;

  constructor(configService: ConfigService<CreateConversionConfig>) {
    this.conversionSystemName = configService.get<string>(
      'APP_CONVERSION_SYSTEM',
    );

    if (!this.conversionSystemName) {
      throw new MissingEnvVarException('APP_CONVERSION_SYSTEM');
    }
  }

  /**
   * Create conversion endpoint.
   */
  @ApiOperation({
    summary: 'Create a conversion.',
    description: 'Create currency conversion.',
  })
  @ApiCreatedResponse({
    description: 'Conversion created.',
    type: CreateConversionRestResponse,
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
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Body() body: CreateConversionBody,
    @KafkaServiceParam(CreateConversionServiceKafka)
    service: CreateConversionServiceKafka,
    @LoggerParam(CreateConversionRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
  ): Promise<CreateConversionRestResponse> {
    // Send a payload.
    const payload: CreateConversionRequest = {
      id: transactionId,
      userId: user.uuid,
      walletId: wallet.id,
      quotationId: body.quotation_id,
      systemName: this.conversionSystemName,
    };

    logger.debug('Send create conversion.', { user, payload });

    // Call send create conversion service.
    const result = await service.execute(payload);

    logger.debug('conversion sent.', result);

    const response = new CreateConversionRestResponse(result);

    return response;
  }
}
