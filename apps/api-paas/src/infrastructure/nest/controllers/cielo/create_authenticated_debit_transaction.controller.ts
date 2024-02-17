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
import { CreateAuthenticatedDebitCieloServiceKafka } from '@zro/cielo/infrastructure';
import { AuthenticatedDebitTransactionRequest } from '@zro/cielo/interface';
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { IsObject, IsString, IsUUID } from 'class-validator';

export class ExternalAuthenticationRequest {
  @ApiProperty({ description: 'Cavv', example: 'AAABB2gHA1B5EFNjWQcDAAAAAAB=' })
  @IsString()
  Cavv: string;

  @ApiProperty({ description: 'Xid', example: 'Uk5ZanBHcWw2RjRCbEN5dGtiMTB=' })
  @IsString()
  Xid: string;

  @ApiProperty({ description: 'Eci', example: '5' })
  @IsString()
  Eci: string;

  @ApiProperty({ description: 'Version', example: '2' })
  @IsString()
  Version: string;

  @ApiProperty({
    description: 'Id de referência',
    example: 'a24a5d87-b1a1-4aef-a37b-2f30b91274e6',
  })
  @IsUUID(4)
  ReferenceId: string;
}

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

class CreateAuthenticatedDebitTransactionBodyResponse {
  @ApiProperty({
    description: 'Checkout Id gerado no pré-checkout',
    example: 'b99g3e8f-f122-4008-a7be-b7fc2aeafggh8',
    required: true,
  })
  CheckoutId: string;

  @ApiProperty({ description: 'Current Status' })
  Status: string;

  constructor(props: ICreateAuthenticatedDebitTransactionBodyResponse) {
    this.CheckoutId = props.CheckoutId;
    this.Status = props.Status;
  }
}

class CreateAuthenticatedDebitTransactionBodyRequest {
  @ApiProperty({
    description: 'Checkout Id gerado no pré-checkout',
    example: 'b99g3e8f-f122-4008-a7be-b7fc2aeafggh8',
    required: true,
  })
  @IsUUID(4)
  CheckoutId: string;

  @ApiProperty({ description: 'Debit card', required: true })
  @IsObject()
  DebitCard: DebitCardRequest;

  @ApiProperty({ description: 'Autenticação externa da transação (3DS 2.0)' })
  @IsObject()
  ExternalAuthentication: ExternalAuthenticationRequest;
}

interface ICreateAuthenticatedDebitTransactionBodyResponse {
  CheckoutId: string;
  Status: string;
}

@ApiBearerAuth()
@ApiTags('Cielo | Checkout')
@Controller('cielo/payments/debit/authenticated')
export class AuthenticatedDebitTransactionController {
  /**
   * create Cielo payment endpoint.
   */
  @ApiOperation({
    summary: 'Create new authenticated debit transaction.',
    description:
      'Create a new checkout transaction with 3DS provider workflow.',
  })
  @ApiCreatedResponse({
    description: 'The Cielo debit transaction returned successfully.',
    type: CreateAuthenticatedDebitTransactionBodyResponse,
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
    @KafkaServiceParam(CreateAuthenticatedDebitCieloServiceKafka)
    service: CreateAuthenticatedDebitCieloServiceKafka,
    @LoggerParam(AuthenticatedDebitTransactionController)
    logger: Logger,
    @Body() body: CreateAuthenticatedDebitTransactionBodyRequest,
  ): Promise<CreateAuthenticatedDebitTransactionBodyResponse> {
    // Create a payload.
    const payload: AuthenticatedDebitTransactionRequest = {
      CheckoutId: body.CheckoutId,
      DebitCard: body.DebitCard,
      ExternalAuthentication: body.ExternalAuthentication,
    };

    logger.debug('Create Cielo transaction.', { user, payload });

    // Call create pixKey service.
    const result = await service.execute(payload);

    logger.debug('Cielo 3DS authenticated debit transaction created.', result);

    const response =
      result && new CreateAuthenticatedDebitTransactionBodyResponse(result);

    return response;
  }
}
