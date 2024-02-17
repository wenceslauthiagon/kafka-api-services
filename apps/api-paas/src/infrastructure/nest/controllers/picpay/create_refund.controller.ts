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
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import { CreateRefundPicPayServiceKafka } from '@zro/picpay/infrastructure';
import { CreateRefundRequest } from '@zro/picpay/interface';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { IsString } from 'class-validator';

export class CreateRefundParamRequest {
  @ApiProperty({
    description: 'Payment reference id.',
    example: '3f436c3d-7e26-dbb6-eb59-c8e70598a113',
  })
  @IsString()
  referenceId!: string;

  @ApiProperty({
    description: 'Payment authorization id.',
    example: '6503bc2dbaba5ef8320b2c09',
  })
  @IsString()
  authorizationId?: string;
}

export interface CreateRefundResponse {
  referenceId: string;
  status: string;
  cancellationId?: string;
  authorizationId?: string;
}

class PicPayRefundRestResponse {
  @ApiProperty({
    description: 'Payment picpay authorization Id.',
    example: '555008cef7f321d00ef236333',
  })
  authorizationId?: string;

  @ApiProperty({
    description: 'Payment picpay reference Id.',
    example: '555008cef7f321d00ef236333',
  })
  referenceId!: string;

  @ApiProperty({
    description: 'Payment picpay status.',
    example: 'created',
  })
  status!: string;

  @ApiProperty({
    description: 'Payment picpay cancellation Id.',
    example: '555008cef7f321d00ef236333',
  })
  cancellationId?: string;

  constructor(props: CreateRefundResponse) {
    this.referenceId = props.referenceId;
    this.status = props.status;
    this.authorizationId = props.authorizationId;
    this.cancellationId = props.cancellationId;
  }
}

@ApiTags('PicPay | Checkout')
@ApiBearerAuth()
@Controller('picpay/payments/refunds')
export class CreateRefundController {
  /**
   * create Picpay refund payment endpoint.
   */
  @ApiOperation({
    summary: 'Create PicPay payment refund.',
    description: 'Create a new PicPay payment.',
  })
  @ApiCreatedResponse({
    description: 'The PicPay refund returned successfully.',
    type: PicPayRefundRestResponse,
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
    @KafkaServiceParam(CreateRefundPicPayServiceKafka)
    service: CreateRefundPicPayServiceKafka,
    @LoggerParam(CreateRefundController)
    logger: Logger,
    @Body() body: CreateRefundParamRequest,
  ): Promise<PicPayRefundRestResponse> {
    // Create a payload.
    const payload: CreateRefundRequest = {
      referenceId: body.referenceId,
      authorizationId: body.authorizationId,
    };

    logger.debug('Create Refund payment.', { user, payload });

    // Call create pixKey service.
    const result = await service.execute(payload);

    logger.debug('PicPay refund payment created.', result);

    const response = result && new PicPayRefundRestResponse(result);

    return response;
  }
}
