import { Controller, Get, Logger, Param } from '@nestjs/common';
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
import { GetPaymentStatusPicPayServiceKafka } from '@zro/picpay/infrastructure';
import { GetPaymentStatusRequest } from '@zro/picpay/interface';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { IsUUID } from 'class-validator';

export class GetPaymentStatusBodyRequest {
  @ApiProperty({
    description: 'Payment picpay checkout Id.',
    example: '475e942d-365e-4857-bc93-d3e76bded1c2',
  })
  @IsUUID(4)
  checkoutId!: string;
}

export interface GetPaymentStatusResponse {
  id: string;
  status: string;
  referenceId: string;
  authorizationId?: string;
  destination: string;
  requesterName: string;
  requesterDocument: string;
  requesterContact: string;
  payload?: string;
  amount: number;
  createdAt: Date;
  expiresAt: Date;
}

class PicPayPaymentStatusRestResponse {
  @ApiProperty({
    description: '`Checkout payment picpay Id.',
    example: '555008cef7f321d00ef236333',
  })
  id!: string;

  @ApiProperty({
    description: 'Payment picpay status.',
    example: 'authorized',
  })
  status!: string;

  @ApiProperty({
    description: 'Payment picpay reference Id.',
    example: '555008cef7f321d00ef236333',
  })
  referenceId!: string;

  @ApiProperty({
    description: 'Payment picpay authorization Id.',
    example: '555008cef7f321d00ef236333',
  })
  authorizationId?: string;

  @ApiProperty({
    description: 'Destination payment.',
    example: 'teste@picpay.com.br',
  })
  destination!: string;

  @ApiProperty({
    description: 'Payment requester Name.',
    example: 'Teste da Silva',
  })
  requesterName!: string;

  @ApiProperty({
    description: 'Payment requester Document.',
    example: '123.456.789-01',
  })
  requesterDocument!: string;

  @ApiProperty({
    description: 'Payment requester Contact.',
    example: '+554199999-8888',
  })
  requesterContact!: string;

  @ApiProperty({
    description: 'Payment payment payload.',
    example: '+554199999-8888',
  })
  payload?: string;

  @ApiProperty({
    description: 'Payment value',
    example: 10.5,
  })
  amount!: number;

  @ApiProperty({
    description: 'Date of payment.',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Expires Date of payment.',
  })
  expiresAt!: Date;

  constructor(props: GetPaymentStatusResponse) {
    this.id = props.id;
    this.status = props.status;
    this.referenceId = props.referenceId;
    this.authorizationId = props.authorizationId;
    this.destination = props.destination;
    this.requesterName = props.requesterName;
    this.requesterDocument = props.requesterDocument;
    this.requesterContact = props.requesterContact;
    this.payload = props.payload;
    this.amount = props.amount;
    this.createdAt = props.createdAt;
    this.expiresAt = props.expiresAt;
  }
}

@ApiBearerAuth()
@ApiTags('PicPay | Checkout')
@Controller('picpay/payments/:checkoutId')
export class GetPaymentStatusController {
  /**
   * get Picpay payment status endpoint.
   */
  @ApiOperation({
    summary: 'Get PicPay payment statyus.',
    description: 'Get from Picpay payment existing.',
  })
  @ApiCreatedResponse({
    description: 'The PicPay payment status returned successfully.',
    type: PicPayPaymentStatusRestResponse,
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
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @KafkaServiceParam(GetPaymentStatusPicPayServiceKafka)
    service: GetPaymentStatusPicPayServiceKafka,
    @LoggerParam(GetPaymentStatusController)
    logger: Logger,
    @Param() params: GetPaymentStatusBodyRequest,
  ): Promise<PicPayPaymentStatusRestResponse> {
    // Create a payload.
    const payload: GetPaymentStatusRequest = {
      checkoutId: params.checkoutId,
    };

    logger.debug('Create PicPay payment status.', { user, payload });

    // Call create pixKey service.
    const result = await service.execute(payload);

    logger.debug('PicPay payment status created.', result);

    const response = result && new PicPayPaymentStatusRestResponse(result);

    return response;
  }
}
