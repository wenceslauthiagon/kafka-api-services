import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
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
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import {
  RemittanceStatus,
  RemittanceSide,
  System,
  Provider,
} from '@zro/otc/domain';
import { AuthAdmin } from '@zro/api-admin/domain';
import {
  GetRemittanceByIdRequest,
  GetRemittanceByIdResponse,
} from '@zro/otc/interface';
import { GetRemittanceByIdServiceKafka } from '@zro/otc/infrastructure';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';

class GetRemittanceByIdParams {
  @ApiProperty({
    description: 'Remittance ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

class GetRemittanceByIdRestResponse {
  @ApiProperty({
    description: 'Remittance ID.',
    example: '195564a9-c5fd-4e73-9abb-72e0383f2dff',
  })
  id: string;

  @ApiProperty({
    description: 'Provider.',
  })
  provider: Provider;

  @ApiProperty({
    description: 'Status.',
    enum: RemittanceStatus,
    example: RemittanceStatus.CLOSED,
  })
  status: RemittanceStatus;

  @ApiProperty({
    description: 'Amount.',
    example: 5000,
  })
  amount: number;

  @ApiProperty({
    description: 'Iof.',
    example: 100,
  })
  iof: number;

  @ApiProperty({
    description: 'Side.',
    enum: RemittanceSide,
    example: RemittanceSide.SELL,
  })
  side: RemittanceSide;

  @ApiProperty({
    description: 'System.',
  })
  system: System;

  @ApiProperty({
    description: 'Bank quote.',
    example: '100',
  })
  bank_quote: number;

  @ApiProperty({
    description: 'Result amount.',
    example: '100',
  })
  result_amount: number;

  @ApiProperty({
    description: 'Exchange contract ID.',
    example: '295564a9-c5fd-4e73-9abb-72e0383f2dfc',
  })
  exchange_contract_id: string;

  @ApiProperty({
    description: 'Send date.',
    example: new Date(),
  })
  send_date: Date;

  @ApiProperty({
    description: 'Receive date.',
    example: new Date(),
  })
  receive_date: Date;

  @ApiProperty({
    description: 'Is Concomitant.',
    example: true,
  })
  is_concomitant: boolean;

  @ApiProperty({
    description: 'Created at.',
    example: new Date(),
  })
  created_at: Date;

  @ApiProperty({
    description: 'Updated at.',
    example: new Date(),
  })
  updated_at: Date;

  constructor(props: GetRemittanceByIdResponse) {
    this.id = props.id;
    this.provider = props.provider;
    this.status = props.status;
    this.amount = props.amount;
    this.iof = props.iof;
    this.side = props.side;
    this.system = props.system;
    this.bank_quote = props.bankQuote;
    this.result_amount = props.resultAmount;
    this.exchange_contract_id = props.exchangeContractId || null;
    this.send_date = props.sendDate;
    this.receive_date = props.receiveDate;
    this.is_concomitant = props.isConcomitant;
    this.created_at = props.createdAt;
    this.updated_at = props.updatedAt;
  }
}

/**
 * Get remittance by id controller. Controller is protected by admin JWT access token.
 */
@ApiTags('Otc | Remittance')
@ApiBearerAuth()
@Controller('otc/remittance/:id')
export class GetRemittanceByIdRestController {
  /**
   * Get all remittance endpoint.
   */
  @ApiOperation({
    summary: 'List remittance by ID.',
    description: 'List a remittance',
  })
  @ApiOkResponse({
    description: 'Remittance have been successfully returned.',
    type: GetRemittanceByIdRestResponse,
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
    @Query() params: GetRemittanceByIdParams,
    @KafkaServiceParam(GetRemittanceByIdServiceKafka)
    service: GetRemittanceByIdServiceKafka,
    @LoggerParam(GetRemittanceByIdRestController)
    logger: Logger,
  ): Promise<GetRemittanceByIdRestResponse> {
    // Create a payload.
    const payload: GetRemittanceByIdRequest = {
      id: params.id,
    };

    logger.debug('Get remittance by id.', { admin, payload });

    // Call get by id remittance service.
    const result = await service.execute(payload);

    logger.debug('Remittance found.', { result });

    const response = new GetRemittanceByIdRestResponse(result);

    return response;
  }
}
