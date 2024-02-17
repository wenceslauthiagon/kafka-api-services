import { BotOtc } from '@zro/otc-bot/domain';

export interface BotOtcRepository {
  create(bot: BotOtc): Promise<BotOtc>;
  update(bot: BotOtc): Promise<BotOtc>;
  getAll(): Promise<BotOtc[]>;
  getById(id: string): Promise<BotOtc>;
}
