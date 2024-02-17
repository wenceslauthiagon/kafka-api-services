import { DatabaseRepository } from '@zro/common';
import { User } from '@zro/users/domain';
import { Card, CardRepository } from '@zro/banking/domain';
import { CardModel } from '@zro/banking/infrastructure';

export class CardDatabaseRepository
  extends DatabaseRepository
  implements CardRepository
{
  static toDomain(card: CardModel): Card {
    return card?.toDomain() ?? null;
  }

  async create(card: Card): Promise<Card> {
    const createdCard = await CardModel.create<CardModel>(card, {
      transaction: this.transaction,
    });

    card.id = createdCard.id;
    card.createdAt = createdCard.createdAt;

    return card;
  }

  async update(card: Card): Promise<Card> {
    await CardModel.update<CardModel>(card, {
      where: { id: card.id },
      transaction: this.transaction,
    });

    return card;
  }

  async getById(id: string): Promise<Card> {
    return CardModel.findOne<CardModel>({
      where: { id },
      transaction: this.transaction,
    }).then(CardDatabaseRepository.toDomain);
  }

  async getByUser(user: User): Promise<Card[]> {
    return CardModel.findAll<CardModel>({
      where: { userId: user.uuid },
      transaction: this.transaction,
    }).then((res) => res.map(CardDatabaseRepository.toDomain));
  }
}
