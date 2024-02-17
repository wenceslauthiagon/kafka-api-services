import { Body, Controller, Logger, Post } from '@nestjs/common';
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
import { CapturePaymentCieloServiceKafka } from '@zro/cielo/infrastructure';
import { CapturePaymentRequest } from '@zro/cielo/interface';

import { KafkaServiceParam, LoggerParam } from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { IsEnum, IsUUID } from 'class-validator';

enum CieloWebhookStatusEnum {
  status_changed = 1,
  recurrence_created = 2,
  anti_fraud_changed = 3,
  recurrence_desactivated = 4,
  refunded = 5,
  ticket = 6,
  chargeback = 7,
  anti_fraud_alert = 8,
}

type TCapturePaymentRequest = {
  ReferenceId: string;
  ChangeType: CieloWebhookStatusEnum;
};

class CapturePaymentBodyRequest implements TCapturePaymentRequest {
  @ApiProperty({
    description: 'Identificador da transação',
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  })
  @IsUUID(4)
  ReferenceId!: string;

  @ApiProperty({
    description: 'Especifica o tipo de notificação',
    example: CieloWebhookStatusEnum.status_changed,
    enum: CieloWebhookStatusEnum,
  })
  @IsEnum(CieloWebhookStatusEnum)
  ChangeType!: CieloWebhookStatusEnum;
}

type TCapturePaymentResponse = {
  CheckoutId: string;
  Status: string;
};

class CapturePaymentRestResponse implements TCapturePaymentResponse {
  @ApiProperty({
    description: 'Checkout Id gerado no pré-checkout',
    example: 'b99g3e8f-f122-4008-a7be-b7fc2aeafggh8',
    required: true,
  })
  CheckoutId: string;

  @ApiProperty({ description: 'Current Status' })
  Status: string;

  constructor(response: TCapturePaymentResponse) {
    this.CheckoutId = response.CheckoutId;
    this.Status = response.Status;
  }
}

@ApiBearerAuth()
@ApiTags('Cielo | Checkout')
@Controller('cielo/payments/webhook')
export class CapturePaymentController {
  /**
   * get Cielo payment status endpoint.
   */
  @ApiOperation({
    summary: 'Capture notification hook.',
    description:
      'Caputure an transaction status changed with notification webhook.',
  })
  @ApiCreatedResponse({
    description: 'The Cielo payment status returned successfully.',
    type: CapturePaymentRestResponse,
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
    @KafkaServiceParam(CapturePaymentCieloServiceKafka)
    service: CapturePaymentCieloServiceKafka,
    @LoggerParam(CapturePaymentController)
    logger: Logger,
    @Body() body: CapturePaymentBodyRequest,
  ): Promise<CapturePaymentRestResponse> {
    logger.debug('Received Cielo capture payment.', { user, body });
    // Create a payload.
    const payload: CapturePaymentRequest = {
      ReferenceId: body.ReferenceId,
      ChangeType: body.ChangeType,
    };

    logger.debug('Capture Cielo payment.', { payload });

    // Call get payment Cielo service.
    const result = await service.execute(payload);

    logger.debug('Cielo payment created.', result);

    const response = result && new CapturePaymentRestResponse(result);

    return response;
  }
}
