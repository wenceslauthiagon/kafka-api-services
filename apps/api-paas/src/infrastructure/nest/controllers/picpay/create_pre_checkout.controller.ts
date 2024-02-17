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
import { CreatePreCheckoutPicPayServiceKafka } from '@zro/picpay/infrastructure';
import { IsEmail, IsNumber, IsObject, IsString } from 'class-validator';

export class CreatePreCheckoutBuyerRequest {
  @ApiProperty({
    description: 'First name of the buyer.',
    example: 'João',
  })
  @IsString()
  firstName!: string;

  @ApiProperty({
    description: 'Last name of the buyer.',
    example: 'Da Silva',
  })
  @IsString()
  lastName!: string;

  @ApiProperty({
    description: 'Document of the buyer.',
    example: '123.456.789-10',
  })
  @IsString()
  document!: string;

  @ApiProperty({
    description: 'Email of the buyer.',
    example: 'teste@picpay.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Phone number of the buyer.',
    example: '+55 27 12345-6789',
  })
  @IsString()
  phone!: string;
}

export class CreatePreCheckoutRequest {
  @ApiProperty({
    description: 'Buyer informations.',
  })
  @IsObject()
  buyer: CreatePreCheckoutBuyerRequest;

  @ApiProperty({ example: 100.5, description: 'Valor da compra' })
  @IsNumber()
  value: number;
}

export interface CreatePreCheckoutResponse {
  checkoutId: string;
}

class PicPayPreCheckoutRestResponse {
  @ApiProperty({
    description: 'Payment picpay checkout Id.',
    example: '102030-12esdf2-asdfadb-1sdfsdfb-12312d',
  })
  checkoutId!: string;

  constructor(props: CreatePreCheckoutResponse) {
    this.checkoutId = props.checkoutId;
  }
}

@Public()
@ApiTags('PicPay | Pre-Checkout')
@Controller('picpay/pre-checkout')
export class CreatePreCheckoutController {
  /**
   * create Picpay pre-checkout endpoint.
   */
  @ApiOperation({
    summary: 'Create new Picpay Pre-Checkout payment.',
    description: 'Create new Picpay Pre-Checkout payment.',
  })
  @ApiCreatedResponse({
    description: 'The PicPay Pre-Checkout returned successfully.',
    type: PicPayPreCheckoutRestResponse,
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
    @KafkaServiceParam(CreatePreCheckoutPicPayServiceKafka)
    service: CreatePreCheckoutPicPayServiceKafka,
    @LoggerParam(CreatePreCheckoutController)
    logger: Logger,
    @Body() body: CreatePreCheckoutRequest,
  ): Promise<PicPayPreCheckoutRestResponse> {
    // Create a payload.
    const payload: CreatePreCheckoutRequest = {
      buyer: body.buyer,
      value: body.value,
    };

    logger.debug('Create PicPay pre-checkout.', { payload });

    // Call create pixKey service.
    const result = await service.execute(payload);

    logger.debug('PicPay pre-checkout created.', result);

    const response = result && new PicPayPreCheckoutRestResponse(result);

    return response;
  }
}
