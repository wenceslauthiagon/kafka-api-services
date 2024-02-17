import { Operation, UserLimit } from '@zro/operations/domain';

export type UserLimitEvent = Pick<UserLimit, 'id' | 'user'> & {
  value?: Operation['value'];
};

export interface UserLimitEventEmitter {
  /**
   * Emit updated event.
   * @param event Data.
   */
  updatedUserLimit: (event: UserLimitEvent) => void;

  /**
   * Emit created event.
   * @param event Data.
   */
  createdUserLimit: (event: UserLimitEvent) => void;
}
