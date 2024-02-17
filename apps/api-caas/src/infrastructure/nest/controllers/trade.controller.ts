/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { HttpErrorResponse } from '@zro/common';
import {
  AcceptQuoteRequest,
  AcceptQuoteResponse,
} from './dto/accept_quote.dto';
import { TradeQuoteRequest, TradeQuoteResponse } from './dto/trade_quote.dto';

@ApiTags('Trade')
@ApiBearerAuth()
@Controller('trades/quotes')
export class TradeController {
  @ApiOperation({
    description: 'Create a trade quote.',
  })
  @ApiBody({
    type: TradeQuoteRequest,
  })
  @ApiCreatedResponse({
    description: 'Quote created successfully.',
    type: TradeQuoteResponse,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Quote creation failed.',
    type: HttpErrorResponse,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createQuote(tradeQuote: TradeQuoteRequest): Promise<TradeQuoteResponse> {
    return null;
  }

  @ApiOperation({
    description: 'Accept a trade quote.',
  })
  @ApiOkResponse({
    description: 'Quote accepted successfully.',
    type: AcceptQuoteResponse,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Quote acceptance failed.',
    type: HttpErrorResponse,
  })
  @ApiBody({
    type: AcceptQuoteRequest,
  })
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  acceptQuote(acceptQuote: AcceptQuoteRequest): Promise<AcceptQuoteResponse> {
    return null;
  }
}
