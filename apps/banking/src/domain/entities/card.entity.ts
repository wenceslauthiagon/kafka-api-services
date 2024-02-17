import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';

export enum CardStatus {
  PASSWORD_PENDING = 'password_pending',
  PASSWORD_LOCKED = 'password_locked',
  ACTIVATED = 'activated',
  PENDING = 'pending',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
}

/**
 * Card.
 */
export interface Card extends Domain<string> {
  user: User;
  cardPspId?: number;
  status?: CardStatus;
  isVirtual: boolean;
  number?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CardEntity implements Card {
  id: string;
  user: User;
  cardPspId?: number;
  status?: CardStatus;
  isVirtual: boolean;
  number?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<Card>) {
    Object.assign(this, props);
  }
}
