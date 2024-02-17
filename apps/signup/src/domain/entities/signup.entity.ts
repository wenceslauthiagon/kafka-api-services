import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';

export enum SignupState {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  NOT_CONFIRMED = 'NOT_CONFIRMED',
  READY = 'READY',
  DUPLICATED = 'DUPLICATED',
  EXPIRED = 'EXPIRED',
  BLOCK_LIST = 'BLOCK_LIST',
}

export interface Signup extends Domain<string> {
  phoneNumber: string;
  state: SignupState;
  name: string;
  password: string;
  email: string;
  confirmCode?: string;
  confirmAttempts: number;
  referralCode?: string;
  duplicate?: User;
  user?: User;
  createdAt?: Date;
  updatedAt?: Date;
  isPending(): boolean;
  isFinalState(): boolean;
}

export class SignupEntity implements Signup {
  id: string;
  phoneNumber: string;
  state: SignupState;
  name: string;
  password: string;
  email: string;
  confirmCode: string;
  confirmAttempts: number;
  referralCode?: string;
  duplicate?: User;
  user?: User;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<Signup>) {
    Object.assign(this, props);
  }

  isPending(): boolean {
    return this.state === SignupState.PENDING;
  }

  isFinalState(): boolean {
    return [
      SignupState.READY,
      SignupState.NOT_CONFIRMED,
      SignupState.BLOCK_LIST,
      SignupState.EXPIRED,
      SignupState.DUPLICATED,
    ].includes(this.state);
  }
}
