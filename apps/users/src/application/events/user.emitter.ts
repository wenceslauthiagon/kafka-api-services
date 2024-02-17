import { Address, Onboarding, User } from '@zro/users/domain';

export type UserEvent = Pick<
  User,
  'id' | 'uuid' | 'name' | 'state' | 'phoneNumber'
>;

export type ActiveUserEvent = Pick<
  User,
  | 'uuid'
  | 'fullName'
  | 'phoneNumber'
  | 'document'
  | 'deletedAt'
  | 'updatedAt'
  | 'state'
  | 'email'
> &
  Pick<
    Address,
    'street' | 'number' | 'city' | 'federativeUnit' | 'country' | 'zipCode'
  > & {
    onboardingUpdatedAt: Onboarding['updatedAt'];
    onboardingReviewAssignee: Onboarding['reviewAssignee'];
  };

export interface UserEventEmitter {
  /**
   * Emit pending user event.
   * @param UserEvent event to fire.
   */
  pendingUser: (event: UserEvent) => void;

  /**
   * Emit update pin user event.
   * @param UserEvent event to fire.
   */
  updatePinUser: (event: UserEvent) => void;

  /**
   * Emit add pin user event.
   * @param UserEvent event to fire.
   */
  addPinUser: (event: UserEvent) => void;
}
