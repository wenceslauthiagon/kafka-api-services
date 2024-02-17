import { Card } from '@zro/banking/domain';
import { User } from '@zro/users/domain';

export interface CardRepository {
  /**
   * Create a new Card.
   * @param card Card to save.
   * @returns The created Card.
   */
  create: (card: Card) => Promise<Card>;

  /**
   * Update a Card.
   * @param card Card to update.
   * @returns The updated Card.
   */
  update: (card: Card) => Promise<Card>;

  /**
   * Get Card by ID.
   * @param id ID.
   * @returns The Card found.
   */
  getById: (id: string) => Promise<Card>;

  /**
   * Get Card by User.
   * @param user User.
   * @returns The Card found.
   */
  getByUser: (operation: User) => Promise<Card[]>;
}
