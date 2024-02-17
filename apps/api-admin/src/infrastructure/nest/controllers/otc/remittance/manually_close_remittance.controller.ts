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
import { Transform } from 'class-transformer';
import { Controller, Patch, Param, Body } from '@nestjs/common';
import { IsOptional, IsUUID, IsInt, Equals } from 'class-validator';
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { RemittanceStatus } from '@zro/otc/domain';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { ManuallyCloseRemittanceServiceKafka } from '@zro/otc/infrastructure';
import {
  ManuallyCloseRemittanceRequest,
  ManuallyCloseRemittanceResponse,
} from '@zro/otc/interface';

class ManuallyCloseRemittanceParams {
  @ApiProperty({
    description: 'Remittance ID.',
  })
  @IsUUID(4)
  id!: string;
}

class ManuallyCloseRemittanceBody {
  @ApiPropertyOptional({
    description: 'Remittance status.',
  })
  @IsOptional()
  @Equals(RemittanceStatus.CLOSED_MANUALLY)
  status?: RemittanceStatus;

  @ApiProperty({
    description: 'Remittance result amount.',
  })
  @IsInt()
  @Transform((params) => params && parseInt(params.value))
  result_amount!: number;

  @ApiProperty({
    description: 'Remittance bank quote.',
  })
  @IsInt()
  @Transform((params) => params && parseInt(params.value))
  bank_quote!: number;
}

class ManuallyCloseRemittanceRestResponse {
  @ApiProperty({
    description: 'Remittance ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Remittance status.',
    example: 'closed_manually',
  })
  status!: string;

  constructor(props: ManuallyCloseRemittanceResponse) {
    this.id = props.id;
    this.status = props.status;
  }
}

/**
 * Close remittance controller. Controller is protected by admin JWT access token.
 */
@ApiTags('Otc | Remittances')
@ApiBearerAuth()
@Controller('otc/close-remittance/:id')
export class ManuallyCloseRemittanceRestController {
  /**
   * Close remittance endpoint.
   */
  @ApiOperation({
    summary: 'Manually close remittance.',
    description:
      'Close remittance by updating the status, amount and bank quote.',
  })
  @ApiOkResponse({
    description: 'Remittance has been successfully updated (closed).',
    type: ManuallyCloseRemittanceRestResponse,
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
  @Patch()
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @Body() body: ManuallyCloseRemittanceBody,
    @Param() params: ManuallyCloseRemittanceParams,
    @KafkaServiceParam(ManuallyCloseRemittanceServiceKafka)
    service: ManuallyCloseRemittanceServiceKafka,
    @LoggerParam(ManuallyCloseRemittanceRestController)
    logger: Logger,
  ): Promise<ManuallyCloseRemittanceRestResponse> {
    // Create a payload.
    const payload: ManuallyCloseRemittanceRequest = {
      id: params.id,
      status: body.status,
      resultAmount: body.result_amount,
      bankQuote: body.bank_quote,
    };

    logger.debug('Close remittance.', { admin, payload });

    // Call close remittance service.
    const result = await service.execute(payload);

    logger.debug('Closed remittance.', { result });

    const response = new ManuallyCloseRemittanceRestResponse(result);

    return response;
  }
}
