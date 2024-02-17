import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { BotOtc, BotOtcRepository } from '@zro/otc-bot/domain';
import { BotOtcModel } from '@zro/otc-bot/infrastructure';

export class BotOtcDatabaseRepository
  extends DatabaseRepository
  implements BotOtcRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(botOtc: BotOtcModel): BotOtc {
    return botOtc?.toDomain() ?? null;
  }

  async create(botOtc: BotOtc): Promise<BotOtc> {
    return BotOtcModel.create(botOtc, {
      transaction: this.transaction,
    }).then(BotOtcDatabaseRepository.toDomain);
  }

  async update(botOtc: BotOtc): Promise<BotOtc> {
    await BotOtcModel.update(botOtc, {
      where: { id: botOtc.id },
      transaction: this.transaction,
    });

    return botOtc;
  }

  async getById(id: string): Promise<BotOtc> {
    return BotOtcModel.findOne<BotOtcModel>({
      where: { id },
      transaction: this.transaction,
    }).then(BotOtcDatabaseRepository.toDomain);
  }

  async getAll(): Promise<BotOtc[]> {
    return BotOtcModel.findAll<BotOtcModel>({
      transaction: this.transaction,
    }).then((bots) => bots.map(BotOtcDatabaseRepository.toDomain));
  }
}
