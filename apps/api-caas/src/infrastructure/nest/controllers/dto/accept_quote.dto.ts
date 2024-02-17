import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Length,
  IsNumber,
} from 'class-validator';
import { PersonType } from '@zro/users/domain';
import { TradeQuotePair, TradeQuoteType } from '@zro/api-caas/domain';
import { getMoment } from '@zro/common';

export class AcceptQuoteRequest {
  @ApiProperty({
    description: 'Related quote UUID.',
    example: 'af63b3e2-8713-468b-86cd-0f364a226f8c',
  })
  @IsUUID(4)
  quoteId: string;

  @ApiProperty({
    type: 'number',
    description:
      '(optional) A quantity to specify for partial execution. Must be less than or equal to the quote base amount.',
    example: 0.0001,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiProperty({
    description: 'Client defined ID. (Max 255 ascii characters).',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientId?: string;

  @ApiProperty({
    description: 'Person type.',
    enum: PersonType,
    example: PersonType.NATURAL_PERSON,
  })
  @IsEnum(PersonType)
  personType: PersonType;

  @ApiProperty({
    description:
      'Document number. Natural person => CPF. Legal person => CNPJ.',
    example: '32651039004',
  })
  @IsString()
  @Length(11, 14)
  personDocument: string;

  @ApiProperty({
    description: 'Person full name. (Max: 80 ascii characters)',
    example: 'John Doe',
  })
  @IsString()
  @MaxLength(80)
  personName: string;

  @ApiProperty({
    description: '(Optional) Person full address. (Max 120 ascii characters)',
    example: 'Ocean Avenue, 1234, Pretty City, BR',
  })
  @IsString()
  @MaxLength(120)
  personAddress: string;
}

export class AcceptQuoteResponse {
  @ApiProperty({
    description: 'Quote accept UUID',
    example: 'e664df2c-7732-4fb0-bbc9-f34a172957f7',
  })
  id: string;

  @ApiProperty({
    description: 'Related quote UUID',
    example: 'af63b3e2-8713-468b-86cd-0f364a226f8c',
  })
  quoteId: string;

  @ApiProperty({
    enum: TradeQuotePair,
    description: 'Related quote pair.',
    example: 'BTC-BRL',
  })
  pair: TradeQuotePair;

  @ApiProperty({
    description: 'Price in quote currency.',
    example: 100100.99,
  })
  price: number;

  @ApiProperty({
    type: 'number',
    description: 'Selected amount.',
    example: 0.0001,
  })
  amount: number;

  @ApiProperty({
    description: 'Total executed.',
    example: 10.01,
  })
  executedValue: number;

  @ApiProperty({
    enum: TradeQuoteType,
    description: 'Related quote type',
  })
  type: TradeQuoteType;

  @ApiProperty({
    description: 'Client defined ID. (Max 255 characters ascii)',
  })
  clientId: string;

  @ApiProperty({
    description: 'Quote acceptance timestamp.',
    example: getMoment(),
  })
  createdAt: Date;
}
