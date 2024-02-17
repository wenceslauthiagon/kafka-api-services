import { Logger } from 'winston';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Controller, UseGuards, Patch, Body, Param } from '@nestjs/common';
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

import { LoggerParam, RequestId } from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import {
  JwtAuthGuard,
  AuthAdminParam,
  UpdateExchangeContractServiceKafka,
} from '@zro/api-admin/infrastructure';
import {
  MountExchangeContractResponse,
  UpdateExchangeContractRequest,
} from '@zro/otc/interface';

export class UpdateExchangeContractPropsParams {
  @ApiProperty({
    description: 'Exchange Contract UUID.',
  })
  @IsUUID(4)
  id!: string;
}

export class UpdateExchangeContractBodyParams {
  @ApiProperty({
    description: 'Exchange Contract contract number.',
    example: 123456,
  })
  @IsOptional()
  @IsString()
  contract_number?: string;

  @ApiProperty({
    description: 'Exchange Contract vet quote.',
    example: 15.7,
  })
  @IsOptional()
  @IsNumber()
  vet_quote?: number;
}

class UpdateExchangeContractRestResponse {
  @ApiProperty({
    description: 'Exchange Contract ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Exchange Contract contract number.',
  })
  contract_number!: string;

  @ApiProperty({
    description: 'Exchange Contract vet quote.',
    example: 15.7,
  })
  vet_quote!: number;

  @ApiProperty({
    description: 'Exchange Contract contract quote.',
    example: 5.68,
  })
  contract_quote!: number;

  @ApiProperty({
    description: 'Exchange Contract total amount.',
    example: 54000,
  })
  total_amount!: number;

  @ApiProperty({
    description: 'Exchange Contract created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: MountExchangeContractResponse) {
    this.id = props.id;
    this.contract_number = props.contractNumber;
    this.vet_quote = props.vetQuote;
    this.contract_quote = props.contractQuote;
    this.total_amount = props.totalAmount;
    this.created_at = props.createdAt;
  }
}

/**
 * Update exchange contracts controller. Controller is protected by JWT access token.
 */
@ApiTags('Exchange Contract')
@ApiBearerAuth()
@Controller('otc/exchange-contracts/:id')
@UseGuards(JwtAuthGuard)
export class UpdateExchangeContractRestController {
  /**
   * Default constructor.
   * @param {UpdateExchangeContractServiceKafka} updateExchangeContractService exchange contract service.
   */
  constructor(
    private readonly updateExchangeContractService: UpdateExchangeContractServiceKafka,
  ) {}

  /**
   * Update ExchangeContract endpoint.
   */
  @ApiOperation({
    summary: 'Update exchange Contract.',
    description: 'Update exchange Contract.',
  })
  @ApiOkResponse({
    description: 'The ExchangeContract was updated successfully.',
    type: UpdateExchangeContractRestResponse,
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
  @Patch()
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @RequestId() requestId: string,
    @Param() params: UpdateExchangeContractPropsParams,
    @Body() body: UpdateExchangeContractBodyParams,
    @LoggerParam(UpdateExchangeContractRestController)
    logger: Logger,
  ): Promise<UpdateExchangeContractRestResponse> {
    // Update exchange contract payload.
    const payload: UpdateExchangeContractRequest = {
      id: params.id,
      contractNumber: body.contract_number,
      vetQuote: body.vet_quote,
    };

    logger.debug('Update ExchangeContract status.', {
      admin,
      id: payload.id,
    });

    const result = await this.updateExchangeContractService.execute(
      requestId,
      payload,
    );

    logger.debug('Exchange Contract updated.', { result });

    const response = new UpdateExchangeContractRestResponse(result);

    return response;
  }
}
