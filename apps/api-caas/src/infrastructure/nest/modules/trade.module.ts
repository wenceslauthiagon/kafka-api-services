import { Module } from '@nestjs/common';
import { TradeController } from '../controllers/trade.controller';

@Module({
  controllers: [TradeController],
})
export class TradeModule {}
