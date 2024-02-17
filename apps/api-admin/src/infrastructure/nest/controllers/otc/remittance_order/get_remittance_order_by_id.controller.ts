import { Logger } from 'winston';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { Controller, Get, Param } from '@nestjs/common';
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import {
  Provider,
  RemittanceOrderSide,
  RemittanceOrderStatus,
  RemittanceOrderType,
  System,
} from '@zro/otc/domain';
import { Currency } from '@zro/operations/domain';
import { AuthAdmin } from '@zro/api-admin/domain';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { GetRemittanceOrderByIdServiceKafka } from '@zro/otc/infrastructure';
import {
  GetRemittanceOrderByIdRequest,
  GetRemittanceOrderByIdResponse,
} from '@zro/otc/interface';

class GetRemittanceOrderByIdParams {
  @ApiProperty({
    description: 'Remittance order ID.',
  })
  @IsUUID(4)
  id: string;
}

class GetRemittanceOrderByIdRestResponse {
  @ApiProperty({
    description: 'RemittanceOrder ID.',
    example: '295564a9-c5fd-4e73-9abb-72e0383f2dfb',
  })
  id: string;

  @ApiProperty({
    enum: RemittanceOrderSide,
    description: 'Remittance order side.',
  })
  side: RemittanceOrderSide;

  @ApiProperty({
    description: 'RemittanceOrder Currency.',
  })
  currency: Currency;

  @ApiProperty({
    description: 'RemittanceOrder amount.',
    example: '14533',
  })
  amount: number;

  @ApiProperty({
    enum: RemittanceOrderStatus,
    description: 'Remittance order status.',
  })
  status: RemittanceOrderStatus;

  @ApiProperty({
    description: 'RemittanceOrder System.',
  })
  system: System;

  @ApiProperty({
    description: 'RemittanceOrder Provider.',
  })
  provider: Provider;

  @ApiPropertyOptional({
    enum: RemittanceOrderType,
    description: 'Remittance order type.',
  })
  type?: RemittanceOrderType;

  @ApiPropertyOptional({
    description: 'Remittances.',
  })
  remittances: [];

  @ApiProperty({
    description: 'Remittance order updatedAt.',
    example: new Date(),
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Remittance order createdAt.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetRemittanceOrderByIdResponse) {
    this.id = props.id;
    this.side = props.side;
    this.currency = props.currency;
    this.amount = props.amount;
    this.status = props.status;
    this.system = props.system;
    this.provider = props.provider;
    this.type = props.type;
    this.created_at = props.createdAt;
    this.updated_at = props.updatedAt;
    this.remittances = props.remittances;
  }
}

/**
 * Get remittance order by id controller. Controller is protected by admin JWT access token.
 */
@ApiTags('Otc | Remittance Orders')
@ApiBearerAuth()
@Controller('otc/remittance-order/:id')
export class GetRemittanceOrderByIdRestController {
  /**
   * Get remittance order by id endpoint.
   */
  @ApiOperation({
    summary: 'Get remittance order by id.',
    description: 'Lists existent remittance order.',
  })
  @ApiOkResponse({
    description: 'Remittance order have been successfully returned.',
    type: GetRemittanceOrderByIdRestResponse,
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
  @Get()
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @KafkaServiceParam(GetRemittanceOrderByIdServiceKafka)
    service: GetRemittanceOrderByIdServiceKafka,
    @LoggerParam(GetRemittanceOrderByIdRestController)
    logger: Logger,
    @Param() params: GetRemittanceOrderByIdParams,
  ): Promise<GetRemittanceOrderByIdRestResponse> {
    // Create a payload.
    const payload: GetRemittanceOrderByIdRequest = {
      id: params.id,
    };

    logger.debug('Get remittance order by id.', { admin, payload });

    // Call get remittance order id service.
    const result = await service.execute(payload);

    logger.debug('Remittance order found.', { result });

    const response = new GetRemittanceOrderByIdRestResponse(result);

    return response;
  }
}
