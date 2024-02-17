import { Body, Controller, Logger, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { KafkaServiceParam, LoggerParam, Public } from '@zro/common';
import { CreatePreCheckoutRequest } from '@zro/cielo/interface';
import { CreatePreCheckoutCieloServiceKafka } from '@zro/cielo/infrastructure';
import { IsNumber, IsObject, IsString } from 'class-validator';

class CreatePreCheckoutPaymentRequest {
  @ApiProperty({ description: 'Amount', example: 10000 })
  @IsNumber()
  Amount: number;

  @ApiProperty({ description: 'Currency', example: 'BRL' })
  @IsString()
  Currency: string;

  @ApiProperty({
    description: 'Interest',
    example: 'Partner Merchant Name Ltda',
  })
  @IsString()
  Interest: string;
}

class AddressRequest {
  @ApiProperty({
    description: 'Street',
    example: 'Alameda Xingu',
  })
  @IsString()
  Street: string;

  @ApiProperty({
    description: 'Number',
    example: '512',
  })
  @IsString()
  Number: string;

  @ApiProperty({
    description: 'Complement',
    example: '27 andar',
  })
  @IsString()
  Complement: string;

  @ApiProperty({
    description: 'Zip code',
    example: '12345987',
  })
  @IsString()
  ZipCode: string;

  @ApiProperty({
    description: 'City',
    example: 'São Paulo',
  })
  @IsString()
  City: string;

  @ApiProperty({
    description: 'State',
    example: 'SP',
  })
  @IsString()
  State: string;

  @ApiProperty({
    description: 'Country',
    example: 'BRA',
  })
  @IsString()
  Country: string;

  @ApiProperty({
    description: 'District',
    example: 'Alphaville',
  })
  @IsString()
  District: string;
}

class CustomerRequest {
  @ApiProperty({ description: 'Name', example: 'Nome do Comprador' })
  @IsString()
  Name: string;

  @ApiProperty({ description: 'Identity', example: '12345678909' })
  @IsString()
  Identity: string;

  @ApiProperty({ description: 'Identity type', example: 'CPF' })
  @IsString()
  IdentityType: string;

  @ApiProperty({ description: 'Email', example: 'comprador@braspag.com.br' })
  @IsString()
  Email: string;

  @ApiProperty({ description: 'Address', required: false })
  @IsObject()
  Address?: AddressRequest;
}

class CreatePreCheckoutBodyRequest {
  @ApiProperty({ description: 'Customer', required: true })
  @IsObject()
  Customer: CustomerRequest;

  @ApiProperty({ description: 'Payment', required: true })
  @IsObject()
  Payment: CreatePreCheckoutPaymentRequest;

  @ApiProperty({ required: false, readOnly: true })
  MerchantOrderId: string;
}

interface CreatePreCheckoutResponse {
  CheckoutId: string;
}

class PreCheckoutRestResponse {
  @ApiProperty({
    description: 'Payment cielo checkout Id.',
    example: '102030-12esdf2-asdfadb-1sdfsdfb-12312d',
  })
  CheckoutId!: string;

  constructor(props: CreatePreCheckoutResponse) {
    this.CheckoutId = props.CheckoutId;
  }
}

@Public()
@ApiTags('Cielo | Pre-Checkout')
@Controller('cielo/pre-checkout')
export class CreateCieloPreCheckoutController {
  /**
   * create Cielo pre-checkout endpoint.
   */
  @ApiOperation({
    summary: 'Create new pre checkout.',
    description:
      'Create a new pre checkout with common data user and amount info.',
  })
  @ApiCreatedResponse({
    description: 'The Cielo pre-checkout returned successfully.',
    type: PreCheckoutRestResponse,
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
    @KafkaServiceParam(CreatePreCheckoutCieloServiceKafka)
    service: CreatePreCheckoutCieloServiceKafka,
    @LoggerParam(CreateCieloPreCheckoutController)
    logger: Logger,
    @Body() body: CreatePreCheckoutBodyRequest,
  ): Promise<PreCheckoutRestResponse> {
    // Create a payload.
    const payload: CreatePreCheckoutRequest = {
      Customer: body.Customer,
      Payment: {
        Amount: body.Payment.Amount,
        Currency: body.Payment.Currency,
        Interest: body.Payment.Interest,
      },
      MerchantOrderId: body.MerchantOrderId,
    };

    logger.debug('Create Cielo pre-checkout.', { payload });

    // Call create pixKey service.
    const result = await service.execute(payload);

    logger.debug('Cielo pre-checkout created.', result);

    const response = result && new PreCheckoutRestResponse(result);

    return response;
  }
}
