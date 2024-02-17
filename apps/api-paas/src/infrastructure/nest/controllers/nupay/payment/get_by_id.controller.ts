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
import { IsUUID } from 'class-validator';
import { DefaultApiHeaders, KafkaServiceParam, LoggerParam } from '@zro/common';
import { PaymentStatusEnum } from '@zro/nupay/domain';
import { GetByIdPaymentNuPayServiceKafka } from '@zro/nupay/infrastructure';
import { GetByIdPaymentRequest } from '@zro/nupay/interface';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';

export class NuPayGetByIdPaymentParamRequest {
  @ApiProperty({
    description: 'Payment nupay checkout Id.',
    example: '475e942d-365e-4857-bc93-d3e76bded1c2',
  })
  @IsUUID(4)
  checkout_id!: string;
}

export interface NuPayGetByIdPaymentResponse {
  id: string;
  status: string;
  referenceId?: string;
  authorizationId?: string;
  destination?: string;
  payload?: any;
  requesterName: string;
  requesterDocument: string;
  requesterContact: string;
  amount: number;
  currency?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

class NuPayPaymentRestResponse {
  @ApiProperty({
    description: 'ID checkout',
    example: 'bea32ecc-0606-4f28-b54c-c69263c04c0d',
  })
  id: string;

  @ApiProperty({
    description: 'Id checkout API externa',
    example: 'e1fa2656-a6d8-4927-a222-1d84217ef14b',
    required: false,
  })
  reference_id?: string;

  @ApiProperty({
    description: 'Id authorization checkout API externa',
    example: 'e1fa2656-a6d8-4927-a222-1d84217ef14b',
    required: false,
  })
  authorization_id?: string;

  @ApiProperty({
    description: 'Payment State',
    example: PaymentStatusEnum.WAITING_PAYMENT_METHOD,
    enum: PaymentStatusEnum,
  })
  status: string;

  @ApiProperty({
    description: 'Destination payment.',
    example: 'afasfasf565asfsa2abc',
  })
  destination?: string;

  @ApiProperty({
    description: 'Buyer name.',
    example: 'afasfasf565asfsa2abc',
  })
  requester_name: string;

  @ApiProperty({
    description: 'Document buyer.',
    example: 'afasfasf565asfsa2abc',
  })
  requester_document: string;

  @ApiProperty({
    description: 'Contact buyer.',
    example: 'afasfasf565asfsa2abc',
  })
  requester_contact: string;

  @ApiProperty({
    description: 'Checkout value.',
    example: 10.01,
  })
  amount: number;

  @ApiProperty({
    description: 'Currency payment.',
    example: 'BRL',
  })
  currency?: string;

  @ApiProperty({
    description: 'Date create payment',
    example: '2023-09-24T05:38:01.133Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Date update payment',
    example: '2023-09-24T05:38:01.133Z',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Date expiration payment',
    example: '2023-09-24T05:38:01.133Z',
  })
  expires_at: Date;

  constructor(props: NuPayGetByIdPaymentResponse) {
    this.id = props.id;
    this.status = props.status;
    this.reference_id = props.referenceId;
    this.authorization_id = props.authorizationId;
    this.destination = props.destination;
    this.requester_name = props.requesterName;
    this.requester_document = props.requesterDocument;
    this.requester_contact = props.requesterContact;
    this.amount = props.amount;
    this.currency = props.currency;
    this.created_at = props.createdAt;
    this.updated_at = props.updatedAt;
    this.expires_at = props.expiresAt;
  }
}

@ApiTags('NuPay | Checkout')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('nupay/payments/:checkout_id')
export class NuPayGetByIdPaymentController {
  /**
   * get Nupay payment status endpoint.
   */
  @ApiOperation({
    summary: 'Get payment by id.',
    description: 'Get a payment by id.',
  })
  @ApiCreatedResponse({
    description: 'The NuPay payment status returned successfully.',
    type: NuPayPaymentRestResponse,
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
    @KafkaServiceParam(GetByIdPaymentNuPayServiceKafka)
    service: GetByIdPaymentNuPayServiceKafka,
    @LoggerParam(NuPayGetByIdPaymentController)
    logger: Logger,
    @Param() params: NuPayGetByIdPaymentParamRequest,
  ): Promise<NuPayPaymentRestResponse> {
    // Create a payload.
    const payload: GetByIdPaymentRequest = {
      checkoutId: params.checkout_id,
    };

    logger.debug('Create NuPay payment status.', { user, payload });

    // Call create pixKey service.
    const result = await service.execute(payload);

    logger.debug('NuPay payment status created.', result);

    const response = result && new NuPayPaymentRestResponse(result);

    return response;
  }
}
