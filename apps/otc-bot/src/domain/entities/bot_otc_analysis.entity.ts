import { BotOtc } from '@zro/otc-bot/domain';

export interface BotOtcAnalysis {
  botOtc: BotOtc;
  profit: number;
  profitMargin: number; // profit/volume
  volume: number;
  quoteCurrencyTag: string; // Corresponds to the remittance fiat tag.
  quoteCurrencyDecimal: number; // Corresponds to the remittance fiat decimal.
}
