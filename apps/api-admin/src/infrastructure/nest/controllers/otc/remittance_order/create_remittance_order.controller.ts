import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
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
import { IsPositive, IsEnum, IsInt, IsUUID } from 'class-validator';
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { RemittanceOrderSide, RemittanceOrderType } from '@zro/otc/domain';
import {
  CreateRemittanceOrderRequest,
  CreateRemittanceOrderResponse,
} from '@zro/otc/interface';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { CreateRemittanceOrderServiceKafka } from '@zro/otc/infrastructure';

class CreateRemittanceOrderBody {
  @ApiProperty({
    description: 'Remittance Side',
    example: RemittanceOrderSide.BUY,
    enum: RemittanceOrderSide,
  })
  @IsEnum(RemittanceOrderSide)
  side!: RemittanceOrderSide;

  @ApiProperty({
    description: 'System Id.',
    example: '54374e4b-01e0-48d9-876f-9ebb2a090c48',
  })
  @IsUUID(4)
  system_id!: string;

  @ApiProperty({
    description: 'Currency Id.',
    example: 2,
  })
  @IsInt()
  @IsPositive()
  currency_id!: number;

  @ApiProperty({
    description: 'Amount.',
    example: 500000,
  })
  @IsInt()
  @IsPositive()
  amount!: number;

  @ApiProperty({
    description: 'Provider Id.',
    example: '284c3bad-b09f-4c90-9d5b-c793756f5730',
  })
  @IsUUID(4)
  provider_id!: string;

  @ApiProperty({
    enum: RemittanceOrderType,
    example: RemittanceOrderType.CRYPTO,
    description: 'Remittance order type.',
  })
  @IsEnum(RemittanceOrderType)
  order_type!: RemittanceOrderType;
}

class CreateRemittanceOrderRestResponse {
  @ApiProperty({
    description: 'Remittance order ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Remittance Order created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: CreateRemittanceOrderResponse) {
    this.id = props.id;
    this.created_at = props.createdAt;
  }
}

/**
 * Remittance Order controller. Controller is protected by JWT access token.
 */
@ApiTags('Otc | Remittance Orders')
@ApiBearerAuth()
@Controller('otc/remittance-orders')
export class CreateRemittanceOrderRestController {
  /**
   * Create remittance order endpoint.
   */
  @ApiOperation({
    summary: 'Add new remittance order.',
    description:
      'Add new remittance order. Return the created remittance order.',
  })
  @ApiCreatedResponse({
    description: 'The remittance order returned successfully.',
    type: CreateRemittanceOrderRestResponse,
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
    @Body() body: CreateRemittanceOrderBody,
    @KafkaServiceParam(CreateRemittanceOrderServiceKafka)
    service: CreateRemittanceOrderServiceKafka,
    @LoggerParam(CreateRemittanceOrderRestController)
    logger: Logger,
  ): Promise<CreateRemittanceOrderRestResponse> {
    // Create a payload.
    const payload: CreateRemittanceOrderRequest = {
      id: uuidV4(),
      side: body.side,
      currencyId: body.currency_id,
      providerId: body.provider_id,
      systemId: body.system_id,
      type: body.order_type,
      amount: body.amount,
    };

    logger.debug('Create remittance order.', { admin, payload });

    // Call create remittance order service.
    const result = await service.execute(payload);

    logger.debug('Remittance order created.', { result });

    return new CreateRemittanceOrderRestResponse(result);
  }
}
