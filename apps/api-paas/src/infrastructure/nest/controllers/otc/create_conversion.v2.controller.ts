import { Controller, Body, Post, Version } from '@nestjs/common';
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
  DefaultApiHeaders,
  EnableReplayProtection,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
  MissingEnvVarException,
  RequestTransactionId,
  TransactionApiHeader,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet } from '@zro/operations/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { AuthWalletParam } from '@zro/operations/infrastructure';
import { CreateConversionServiceKafka } from '@zro/otc/infrastructure';
import {
  CreateConversionRequest,
  CreateConversionResponse,
} from '@zro/otc/interface';

class V2CreateConversionBody {
  @ApiProperty({
    description: 'Quotation ID to convert.',
    example: 'abb8e578-6540-4104-8fa9-90a854ab0d1c',
  })
  @IsUUID(4)
  quotation_id: string;
}

class V2CreateConversionRestResponse {
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
    description: 'Conversion created at.',
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
 * User otc controller. Controller is protected by JWT access token.
 */
@ApiTags('Otc | Conversions')
@ApiBearerAuth()
@DefaultApiHeaders()
@TransactionApiHeader()
@EnableReplayProtection()
@Controller('otc/conversions')
@HasPermission('api-paas-post-otc-conversions')
export class V2CreateConversionRestController {
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
    summary: 'Create new currency conversion.',
    description:
      "To create a new currency conversion, first you need to create a Quotation ID at the endpoint /v2/quotations/spot. With the quotation_id created, enter it's information on the requisition body below and execute.",
  })
  @ApiCreatedResponse({
    description: 'Conversion created.',
    type: V2CreateConversionRestResponse,
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
  @Version('2')
  @Post()
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Body() body: V2CreateConversionBody,
    @KafkaServiceParam(CreateConversionServiceKafka)
    service: CreateConversionServiceKafka,
    @LoggerParam(V2CreateConversionRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
  ): Promise<V2CreateConversionRestResponse> {
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

    logger.debug('Conversion sent.', { result });

    const response = new V2CreateConversionRestResponse(result);

    return response;
  }
}
