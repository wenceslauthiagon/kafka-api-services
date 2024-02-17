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
import { GetPaymentCieloServiceKafka } from '@zro/cielo/infrastructure';
import { GetPaymentRequest } from '@zro/cielo/interface';
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { IsUUID } from 'class-validator';

type TGetPaymentRequest = {
  checkoutId: string;
};

class GetPaymentParamRequest implements TGetPaymentRequest {
  @ApiProperty({
    description: 'Payment cielo checkout Id.',
    example: '475e942d-365e-4857-bc93-d3e76bded1c2',
  })
  @IsUUID(4)
  checkoutId!: string;
}

type TGetPaymentResponse = {
  Id: string;
  Status: string;
  ReferenceId: string;
  AuthorizationId?: string;
  Destination: string;
  RequesterName: string;
  RequesterDocument: string;
  RequesterContact: string;
  Amount: number;
  CreatedAt: Date;
  Historic?: TGetPaymentHistoricResponse[];
};

type TGetPaymentHistoricResponse = {
  Id: string;
  CheckoutId: string;
  CurrentStatus: string;
  PreviousStatus: string | null;
  Action: string;
  CreatedAt: Date;
};

class CieloGetPaymentHistoricRestResponse
  implements TGetPaymentHistoricResponse
{
  @ApiProperty()
  Id: string;

  @ApiProperty()
  CheckoutId: string;

  @ApiProperty()
  CurrentStatus: string;

  @ApiProperty()
  PreviousStatus: string;

  @ApiProperty()
  Action: string;

  @ApiProperty()
  CreatedAt: Date;

  constructor(props: TGetPaymentHistoricResponse) {
    this.Id = props.Id;
    this.CheckoutId = props.CheckoutId;
    this.CurrentStatus = props.CurrentStatus;
    this.PreviousStatus = props.PreviousStatus;
    this.Action = props.Action;
    this.CreatedAt = props.CreatedAt;
  }
}

class CieloGetPaymentRestResponse implements TGetPaymentResponse {
  @ApiProperty({
    description: 'Checkout payment cielo Id.',
    example: '555008cef7f321d00ef236333',
  })
  Id: string;

  @ApiProperty({
    description: 'Payment cielo status.',
    example: 'authorized',
  })
  Status: string;

  @ApiProperty({
    description: 'Payment cielo reference Id.',
    example: '555008cef7f321d00ef236333',
  })
  ReferenceId: string;

  @ApiProperty({
    description: 'Payment cielo authorization Id.',
    example: '555008cef7f321d00ef236333',
  })
  AuthorizationId?: string;

  @ApiProperty({
    description: 'Destination payment.',
    example: 'teste@cielo.com.br',
  })
  Destination: string;

  @ApiProperty({
    description: 'Payment requester Name.',
    example: 'Teste da Silva',
  })
  RequesterName: string;

  @ApiProperty({
    description: 'Payment requester Document.',
    example: '123.456.789-01',
  })
  RequesterDocument: string;

  @ApiProperty({
    description: 'Payment requester Contact.',
    example: '+554199999-8888',
  })
  RequesterContact: string;

  @ApiProperty({
    description: 'Payment payment payload.',
    example: '+554199999-8888',
  })
  Payload?: string;

  @ApiProperty({
    description: 'Payment value',
    example: 10.5,
  })
  Amount: number;

  @ApiProperty({
    description: 'Date of payment.',
  })
  CreatedAt: Date;

  @ApiProperty({
    description: 'Current Source Provider.',
  })
  Source: string;

  @ApiProperty()
  Historic?: CieloGetPaymentHistoricRestResponse[];

  constructor(props: TGetPaymentResponse) {
    this.Id = props.Id;
    this.Status = props.Status;
    this.ReferenceId = props.ReferenceId;
    this.AuthorizationId = props.AuthorizationId;
    this.Destination = props.Destination;
    this.RequesterName = props.RequesterName;
    this.RequesterDocument = props.RequesterDocument;
    this.RequesterContact = props.RequesterContact;
    this.Amount = props.Amount;
    this.CreatedAt = props.CreatedAt;
    this.Historic = props.Historic;
  }
}

@ApiBearerAuth()
@ApiTags('Cielo | Checkout')
@Controller('cielo/payments/:checkoutId')
export class GetPaymentController {
  /**
   * get Cielo payment status endpoint.
   */
  @ApiOperation({
    summary: 'Get checkout info.',
    description: 'Get checkout info by unique identifier.',
  })
  @ApiCreatedResponse({
    description: 'The Cielo payment status returned successfully.',
    type: CieloGetPaymentRestResponse,
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
    @KafkaServiceParam(GetPaymentCieloServiceKafka)
    service: GetPaymentCieloServiceKafka,
    @LoggerParam(GetPaymentController)
    logger: Logger,
    @Param() params: GetPaymentParamRequest,
  ): Promise<CieloGetPaymentRestResponse> {
    // Create a payload.
    const payload: GetPaymentRequest = {
      CheckoutId: params.checkoutId,
    };

    logger.debug('Get Cielo payment.', { user, payload });

    // Call get payment Cielo service.
    const result = await service.execute(payload);

    logger.debug('Cielo payment created.', result);

    const response = result && new CieloGetPaymentRestResponse(result);

    return response;
  }
}
