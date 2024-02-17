import { Controller, Logger, Param, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CancelTransactionCieloServiceKafka } from '@zro/cielo/infrastructure';
import { CancelTransactionRequest } from '@zro/cielo/interface';
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { IsUUID } from 'class-validator';

type TCancelTransactionRequest = {
  checkoutId: string;
};

class CancelTransactionBodyRequest implements TCancelTransactionRequest {
  @ApiProperty({
    description: 'Checkout Id gerado no pré-checkout',
    example: 'b99g3e8f-f122-4008-a7be-b7fc2aeafggh8',
    required: true,
  })
  @IsUUID(4)
  checkoutId!: string;
}

interface ICancelTransactionResponse {
  CheckoutId: string;
  Status: string;
}

class CancelTransactionResponse {
  @ApiProperty({
    description: 'Checkout Id gerado no pré-checkout',
    example: 'b99g3e8f-f122-4008-a7be-b7fc2aeafggh8',
    required: true,
  })
  CheckoutId: string;

  @ApiProperty({ description: 'Current Status' })
  Status: string;

  constructor(props: ICancelTransactionResponse) {
    this.CheckoutId = props.CheckoutId;
    this.Status = props.Status;
  }
}

@ApiBearerAuth()
@ApiTags('Cielo | Checkout')
@Controller('cielo/payments/:checkoutId/refund')
export class CancelTransactionController {
  /**
   * Cielo cancel/refund payment endpoint.
   */
  @ApiOperation({
    summary: 'Request a refund.',
    description: 'Request a new void for payment checkout.',
  })
  @ApiCreatedResponse({
    description: 'The Cielo pre-checkout returned successfully.',
    type: CancelTransactionResponse,
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
  @Put()
  async execute(
    @AuthUserParam() user: AuthUser,
    @KafkaServiceParam(CancelTransactionCieloServiceKafka)
    service: CancelTransactionCieloServiceKafka,
    @LoggerParam(CancelTransactionController)
    logger: Logger,
    @Param() param: CancelTransactionBodyRequest,
  ): Promise<CancelTransactionResponse> {
    // Create a payload.
    const payload: CancelTransactionRequest = {
      CheckoutId: param.checkoutId,
    };

    logger.debug('Cielo refund transaction.', { user, payload });

    // Call Cielo refund transaction service.
    const result = await service.execute(payload);

    logger.debug('Cielo refund created.', result);

    const response = result && new CancelTransactionResponse(result);

    return response;
  }
}
