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
import { CreateCreditCieloServiceKafka } from '@zro/cielo/infrastructure';
import { CreditTransactionRequest } from '@zro/cielo/interface';
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { IsObject, IsString } from 'class-validator';

class CreditCardRequest {
  @ApiProperty({
    description: 'Número do cartão de crédito',
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

  @ApiProperty({
    description: 'Código de segurança do cartão de crédito',
    example: '123',
  })
  @IsString()
  SecurityCode: string;

  @ApiProperty({ description: 'Bandeira do cartão', example: 'Visa' })
  @IsString()
  Brand: string;
}

class CreateCreditTransactionBodyRequest {
  @ApiProperty({
    description: 'Checkout Id gerado no pré-checkout',
    example: 'b99g3e8f-f122-4008-a7be-b7fc2aeafggh8',
    required: true,
  })
  @IsString()
  CheckoutId: string;

  @ApiProperty({ description: 'Credit card', required: true })
  @IsObject()
  CreditCard: CreditCardRequest;
}

class CreateCreditTransactionResponse {
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
@Controller('cielo/payments/credit')
export class CreditTransactionController {
  /**
   * create Cielo payment endpoint.
   */
  @ApiOperation({
    summary: 'Create new credit transaction.',
    description: 'Create a new checkout transaction with credit.',
  })
  @ApiCreatedResponse({
    description: 'The Cielo credit transaction returned successfully.',
    type: CreateCreditTransactionResponse,
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
    @KafkaServiceParam(CreateCreditCieloServiceKafka)
    service: CreateCreditCieloServiceKafka,
    @LoggerParam(CreditTransactionController)
    logger: Logger,
    @Body() body: CreateCreditTransactionBodyRequest,
  ): Promise<CreateCreditTransactionResponse> {
    // Create a payload.
    const payload: CreditTransactionRequest = {
      CheckoutId: body.CheckoutId,
      CreditCard: body.CreditCard,
    };

    logger.debug('Create Cielo transaction.', { user, payload });

    // Call create pixKey service.
    const result = await service.execute(payload);

    logger.debug('Cielo credit transaction created.', result);

    const response = result && new CreateCreditTransactionResponse(result);

    return response;
  }
}
