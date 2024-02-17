import { UserPinAttempts } from '@zro/users/domain';

export interface UserPinAttemptsEvent {
  id: string;
  userId: string;
  updatedAt: Date;
  attempts: number;
}

export interface UserPinAttemptsEventEmitter {
  /**
   * Emit updated user pin attempts event.
   * @param userPinAttempts Data.
   */
  updatedUserPinAttempts: (userPinAttempts: UserPinAttempts) => void;
}
