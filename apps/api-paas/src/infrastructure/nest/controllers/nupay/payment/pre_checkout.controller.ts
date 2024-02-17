import { Body, Controller, Logger, Post } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsObject, IsString } from 'class-validator';
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
import { DocumentTypeEnum } from '@zro/nupay/domain';
import { PreCheckoutNuPayServiceKafka } from '@zro/nupay/infrastructure';
import { PreCheckoutRequest } from '@zro/nupay/interface';

type TBuyer = {
  first_name: string;
  last_name: string;
  document: string;
  document_type: DocumentTypeEnum;
  email: string;
  phone: string;
};

export class Buyer implements TBuyer {
  @ApiProperty({
    description: 'First name buyer',
    example: 'John',
  })
  @IsString()
  first_name: string;

  @ApiProperty({
    description: 'Last name buyer',
    example: 'Doe',
  })
  @IsString()
  last_name: string;

  @ApiProperty({
    description: 'Document buyer',
    example: '64262091040',
  })
  @IsString()
  document: string;

  @ApiProperty({
    description: 'Document type buyer',
    example: DocumentTypeEnum.CPF,
    enum: DocumentTypeEnum,
  })
  @IsEnum(DocumentTypeEnum)
  document_type: DocumentTypeEnum;

  @ApiProperty({
    description: 'Email buyer',
    example: 'john.doe@example.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Phone buyer',
    example: '21987654321',
  })
  @IsString()
  phone: string;
}

type TProductItem = {
  id: string;
  description: string;
  value: number;
  quantity: number;
};

export class ProductItem implements TProductItem {
  @ApiProperty({
    description: 'Code product',
    example: '132981',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Name product',
    example: 'TV',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Value product',
    example: 10.01,
  })
  @IsNumber()
  value: number;

  @ApiProperty({
    description: 'Quantity product',
    example: 1,
  })
  @IsNumber()
  quantity: number;
}

type TBillingAddress = {
  country: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  postal_code: string;
  city: string;
  state: string;
};

export class BillingAddress implements TBillingAddress {
  @ApiProperty({
    description: 'Country',
    example: 'BRA',
  })
  @IsString()
  country: string;

  @ApiProperty({
    description: 'Street',
    example: 'Praia de Botafogo St.',
  })
  @IsString()
  street: string;

  @ApiProperty({
    description: 'Number',
    example: '300',
  })
  @IsString()
  number: string;

  @ApiProperty({
    description: 'Complement',
    example: '3o. Andar',
  })
  @IsString()
  complement: string;

  @ApiProperty({
    description: 'Neighborhood',
    example: 'Botafogo',
  })
  @IsString()
  neighborhood: string;

  @ApiProperty({
    description: 'Postal code',
    example: '22250040',
  })
  @IsString()
  postal_code: string;

  @ApiProperty({
    description: 'City',
    example: 'Rio de Janeiro',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'State',
    example: 'RJ',
  })
  @IsString()
  state: string;
}

export class PreCheckoutBodyRequest {
  @ApiProperty({
    example: 100.5,
    description: 'Total value buy.',
    required: true,
  })
  @IsNumber()
  value: number;

  @ApiProperty({
    description: 'Buyer.',
    type: Buyer,
  })
  @Type(() => Buyer)
  @IsObject()
  buyer: Buyer;

  @ApiProperty({
    description: 'Product item.',
    type: ProductItem,
    isArray: true,
  })
  @Type(() => ProductItem)
  @IsArray()
  items: ProductItem[];

  @ApiProperty({
    description: 'Billing Address.',
    type: BillingAddress,
  })
  @Type(() => BillingAddress)
  @IsObject()
  billing_address?: BillingAddress;
}

export interface PreCheckoutResponse {
  checkoutId: string;
}

class NuPayPreCheckoutRestResponse {
  @ApiProperty({
    description: 'Payment nupay checkout Id.',
    example: '102030-12esdf2-asdfadb-1sdfsdfb-12312d',
  })
  checkout_id!: string;

  constructor(props: PreCheckoutResponse) {
    this.checkout_id = props.checkoutId;
  }
}

@ApiTags('NuPay | Pre-Checkout')
@Public()
@Controller('nupay/pre-checkout')
export class PreCheckoutController {
  /**
   * create NuPay pre-checkout endpoint.
   */
  @ApiOperation({
    summary: 'Pre Checkout.',
    description: 'Create a payment pre checkout.',
  })
  @ApiCreatedResponse({
    description: 'The NuPay pre-checkout returned successfully.',
    type: NuPayPreCheckoutRestResponse,
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
    @KafkaServiceParam(PreCheckoutNuPayServiceKafka)
    service: PreCheckoutNuPayServiceKafka,
    @LoggerParam(PreCheckoutController)
    logger: Logger,
    @Body() body: PreCheckoutBodyRequest,
  ): Promise<NuPayPreCheckoutRestResponse> {
    // Create a payload.
    const payload: PreCheckoutRequest = {
      amount: body.value,
      shopper: {
        firstName: body.buyer.first_name,
        lastName: body.buyer.last_name,
        document: body.buyer.document,
        documentType: body.buyer.document_type,
        email: body.buyer.email,
        phone: body.buyer.phone,
      },
      items: body.items.map((element) => ({
        id: element.id,
        description: element.description,
        quantity: element.quantity,
        value: element.value,
      })),
      billingAddress: {
        street: body.billing_address.street,
        number: body.billing_address.number,
        postalCode: body.billing_address.postal_code,
        city: body.billing_address.city,
        state: body.billing_address.state,
        country: body.billing_address.country,
        complement: body.billing_address.complement,
        neighborhood: body.billing_address.neighborhood,
      },
    };

    logger.debug('Create NuPay pre-checkout.', { payload });

    // Call create pixKey service.
    const result = await service.execute(payload);

    logger.debug('NuPay pre-checkout created.', result);

    const response = result && new NuPayPreCheckoutRestResponse(result);

    return response;
  }
}
