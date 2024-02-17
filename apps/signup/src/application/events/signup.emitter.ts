import { SignupState } from '@zro/signup/domain';

export interface SignupEvent {
  id: string;
  state: SignupState;
  phoneNumber: string;
}

export interface SignupEventEmitter {
  /**
   * Call signup microservice to emit signup confirm event.
   * @param signup Data.
   */
  pendingSignup: (signup: SignupEvent) => void;

  /**
   * Call signup microservice to emit signup confirm event.
   * @param signup Data.
   */
  confirmSignup: (signup: SignupEvent) => void;

  /**
   * Call signup microservice to emit signup not confirm event.
   * @param signup Data.
   */
  notConfirmSignup: (signup: SignupEvent) => void;

  /**
   * Call signup microservice to emit signup user duplicated event.
   * @param signup Data.
   */
  duplicateSignup: (signup: SignupEvent) => void;

  /**
   * Call signup microservice to emit signup ready event.
   * @param signup Data.
   */
  readySignup: (signup: SignupEvent) => void;
}
