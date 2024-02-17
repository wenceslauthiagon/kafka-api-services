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
import { CreateNonAuthenticatedDebitTransactionCieloServiceKafka } from '@zro/cielo/infrastructure';
import { NonAuthenticatedDebitTransactionRequest } from '@zro/cielo/interface';
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { IsObject, IsString } from 'class-validator';

class DebitCardRequest {
  @ApiProperty({
    description: 'Número do cartão de débito',
    example: '4551870000000181',
  })
  @IsString()
  CardNumber: string;

  @ApiProperty({
    description: 'Nome do comprador impresso no cartão',
    example: '4551870000000181',
  })
  @IsString()
  Holder: string;

  @ApiProperty({
    description: 'Data de vencimento do cartão',
    example: '12/2024',
  })
  @IsString()
  ExpirationDate: string;

  @ApiProperty({ description: 'Bandeira do cartão', example: 'Visa' })
  @IsString()
  Brand: string;
}

class CreateNonAuthenticatedDebitTransactionBodyRequest {
  @ApiProperty({
    description: 'Checkout Id gerado no pré-checkout',
    example: 'b99g3e8f-f122-4008-a7be-b7fc2aeafggh8',
    required: true,
  })
  @IsString()
  CheckoutId: string;

  @ApiProperty({ description: 'Credit card', required: true })
  @IsObject()
  DebitCard: DebitCardRequest;
}

class CreateNonAuthenticatedDebitTransactionResponse {
  @ApiProperty({
    description: 'Checkout Id gerado no pré-checkout',
    example: 'b99g3e8f-f122-4008-a7be-b7fc2aeafggh8',
    required: true,
  })
  CheckoutId: string;

  @ApiProperty({ description: 'Current Status' })
  Status: string;

  constructor(props: ICreateCreditTransactionResponse) {
    this.CheckoutId = props.CheckoutId;
    this.Status = props.Status;
  }
}

interface ICreateCreditTransactionResponse {
  CheckoutId: string;
  Status: string;
}

@ApiBearerAuth()
@ApiTags('Cielo | Checkout')
@Controller('cielo/payments/debit/non-authenticated')
export class NonAuthenticatedDebitTransactionController {
  /**
   * create Cielo payment endpoint.
   */
  @ApiOperation({
    summary: 'Create new non authenticated debit transaction.',
    description:
      'Create a new checkout transaction without authentication workflow.',
  })
  @ApiCreatedResponse({
    description:
      'The Cielo non authenticated debit transaction returned successfully.',
    type: CreateNonAuthenticatedDebitTransactionResponse,
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
    @KafkaServiceParam(CreateNonAuthenticatedDebitTransactionCieloServiceKafka)
    service: CreateNonAuthenticatedDebitTransactionCieloServiceKafka,
    @LoggerParam(NonAuthenticatedDebitTransactionController)
    logger: Logger,
    @Body() body: CreateNonAuthenticatedDebitTransactionBodyRequest,
  ): Promise<CreateNonAuthenticatedDebitTransactionResponse> {
    // Create a payload.
    const payload: NonAuthenticatedDebitTransactionRequest = {
      CheckoutId: body.CheckoutId,
      DebitCard: {
        Brand: body.DebitCard.Brand,
        CardNumber: body.DebitCard.CardNumber,
        ExpirationDate: body.DebitCard.ExpirationDate,
        Holder: body.DebitCard.Holder,
      },
    };

    logger.debug('Create Cielo non authenticated debit transaction.', {
      user,
      payload,
    });

    // Call create pixKey service.
    const result = await service.execute(payload);

    logger.debug('Cielo non authenticated debit transaction created.', result);

    const response =
      result && new CreateNonAuthenticatedDebitTransactionResponse(result);

    return response;
  }
}
