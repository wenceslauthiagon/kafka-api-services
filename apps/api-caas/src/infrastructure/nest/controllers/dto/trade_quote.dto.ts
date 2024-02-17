import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsPositive,
  IsString,
  MaxLength,
  IsNumber,
} from 'class-validator';
import { TradeQuotePair, TradeQuoteType } from '@zro/api-caas/domain';
import { getMoment } from '@zro/common';

export class TradeQuoteRequest {
  @ApiProperty({
    enum: TradeQuotePair,
    description:
      'Quote pair. Pair is a "<base currency>-<quote currency>" string.',
    example: 'BTC-BRL',
  })
  @IsEnum(TradeQuotePair)
  pair: TradeQuotePair;

  @ApiProperty({
    type: 'number',
    description:
      'Base amount to trade. With BTC-BRL pair, use 0.0001 to buy "0.0001 BTC"',
    example: 0.0001,
  })
  @IsNumber()
  @IsPositive()
  baseAmount: number;

  @ApiProperty({
    enum: TradeQuoteType,
    description:
      'Quote type. Use "buy" type to buy <base currency>, or use "sell" type to sell <base currency>.',
  })
  @IsEnum(TradeQuoteType)
  type: TradeQuoteType;

  @ApiProperty({
    description: 'Client defined ID. (Max 255 ascii characters)',
    required: false,
  })
  @IsString()
  @MaxLength(255)
  clientId?: string;
}

export class TradeQuoteResponse {
  @ApiProperty({
    description: 'Quote UUID',
    example: 'af63b3e2-8713-468b-86cd-0f364a226f8c',
  })
  id: string;

  @ApiProperty({
    description: '(Optional) Client defined ID. (Max 255 ascii characters)',
  })
  clientId: string;

  @ApiProperty({
    enum: TradeQuotePair,
    description: 'Selected quote pair.',
    example: 'BTC-BRL',
  })
  pair: TradeQuotePair;

  @ApiProperty({
    description: 'Selected base currency.',
    example: 'BTC',
  })
  baseCurrency: string;

  @ApiProperty({
    description: 'Selected quote currency.',
    example: 'BRL',
  })
  quoteCurrency: string;

  @ApiProperty({
    description: 'Price in quote currency.',
    example: 100100.99,
  })
  price: number;

  @ApiProperty({
    type: 'number',
    description: 'Selected base amount.',
    example: 0.0001,
  })
  baseAmount: number;

  @ApiProperty({
    description: 'Total quoted amount.',
    example: 10.01,
  })
  quoteAmount: number;

  @ApiProperty({
    enum: TradeQuoteType,
    description: 'Selected quote type',
  })
  type: TradeQuoteType;

  @ApiProperty({
    description: 'Quote creation timestamp.',
    example: getMoment(),
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Quote expiration timestamp.',
    example: getMoment().add(1, 'minutes'),
  })
  expireAt: Date;
}
