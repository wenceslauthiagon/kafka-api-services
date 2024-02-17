import { Controller, Logger, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import { Qrcode } from '@zro/picpay/domain';
import { CreatePaymentPicPayServiceKafka } from '@zro/picpay/infrastructure';
import { CreatePaymentRequest } from '@zro/picpay/interface';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { IsUUID } from 'class-validator';

export class CreatePaymentParamRequest {
  @ApiProperty({
    description: 'Payment pré-checkout Id.',
    example: 'f06fdd63-6d42-417b-bbaa-dc8e2dd99948',
  })
  @IsUUID(4)
  checkoutId!: string;
}

export interface CreatePaymentResponse {
  referenceId: string;
  paymentUrl: string;
  expiresAt: Date;
  qrcode: Qrcode;
}

class PicPayPaymentRestResponse {
  @ApiProperty({
    description: 'Payment picpay reference Id.',
    example: 'f06fdd63-6d42-417b-bbaa-dc8e2dd99948',
  })
  referenceId!: string;

  @ApiProperty({
    description: 'Payment picpay url.',
    example: 'https://app.picpay.com/checkout/NWFmMGRjNmViZDc0Y2EwMDMwNzZlYzEw',
  })
  paymentUrl!: string;

  @ApiProperty({
    description: 'Exipires date.',
    format: 'YYYY-MM-DD',
    required: false,
  })
  expiresAt!: Date;

  @ApiProperty({
    description: 'QR Code.',
    example: {
      content:
        'https://app.picpay.com/checkout/NWNlYzMxOTM1MDg1NGEwMDIwMzUxODcy',
      base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZII=',
    },
  })
  qrcode!: Qrcode;

  constructor(props: CreatePaymentResponse) {
    this.referenceId = props.referenceId;
    this.paymentUrl = props.paymentUrl;
    this.expiresAt = props.expiresAt;
    this.qrcode = props.qrcode;
  }
}

@ApiTags('PicPay | Checkout')
@ApiBearerAuth()
@Controller('picpay/payments/:checkoutId')
export class CreatePaymentController {
  /**
   * create Picpay payment endpoint.
   */
  @ApiOperation({
    summary: 'Create a new PicPay payment.',
    description: 'Create a new PicPay payment.',
  })
  @ApiCreatedResponse({
    description: 'The PicPay payment returned successfully.',
    type: PicPayPaymentRestResponse,
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
    @KafkaServiceParam(CreatePaymentPicPayServiceKafka)
    service: CreatePaymentPicPayServiceKafka,
    @LoggerParam(CreatePaymentController)
    logger: Logger,
    @Param() params: CreatePaymentParamRequest,
  ): Promise<PicPayPaymentRestResponse> {
    // Create a payload.
    const payload: CreatePaymentRequest = {
      checkoutId: params.checkoutId,
    };

    logger.debug('Create PicPay payment.', { user, payload });

    // Call create pixKey service.
    const result = await service.execute(payload);

    logger.debug('PicPay payment created.', result);

    const response = result && new PicPayPaymentRestResponse(result);

    return response;
  }
}
