import { Controller, Get, Logger } from '@nestjs/common';
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
import { DefaultApiHeaders, KafkaServiceParam, LoggerParam } from '@zro/common';
import { PaymentStatusEnum } from '@zro/nupay/domain';
import { GetAllPaymentNuPayServiceKafka } from '@zro/nupay/infrastructure';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';

export interface NuPayGetAllPaymentResponseItem {
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

  constructor(props: NuPayGetAllPaymentResponseItem) {
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
export interface GetAllPaymentsResponse {
  payments: NuPayPaymentRestResponse[];
}

class NuPayGetAllPaymentsRestResponse {
  @ApiProperty({
    description: 'Produtos da compra',
    example: [
      {
        id: '132981',
        description: 'Produto Exemplo',
        value: 10.01,
        quantity: 1,
      },
    ],
    isArray: true,
    type: NuPayPaymentRestResponse,
    required: true,
  })
  payments: NuPayPaymentRestResponse[];

  constructor(props: GetAllPaymentsResponse) {
    this.payments = props.payments;
  }
}

@ApiTags('NuPay | Checkout')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('nupay/payments')
export class NuPayGetAllPaymentController {
  /**
   * get Nupay payment status endpoint.
   */
  @ApiOperation({
    summary: 'Get all payments.',
    description: 'Return all payments.',
  })
  @ApiCreatedResponse({
    description: 'The NuPay payment status returned successfully.',
    type: NuPayGetAllPaymentsRestResponse,
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
    @KafkaServiceParam(GetAllPaymentNuPayServiceKafka)
    service: GetAllPaymentNuPayServiceKafka,
    @LoggerParam(NuPayGetAllPaymentController)
    logger: Logger,
  ): Promise<NuPayGetAllPaymentsRestResponse> {
    logger.debug('Get all NuPay payment.', { user });

    // Call create pixKey service.
    const result = await service.execute();

    logger.debug('NuPay payment status created.', result);

    const response = new NuPayGetAllPaymentsRestResponse({
      payments: result.payments.map(
        (item) => new NuPayPaymentRestResponse(item),
      ),
    });

    return response;
  }
}
