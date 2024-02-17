import { Domain } from '@zro/common';

export interface Notification extends Domain<string> {
  disablePush: boolean;
  disableEmail: boolean;
}

export class NotificationEntity implements Notification {
  disablePush: boolean;
  disableEmail: boolean;

  constructor(props: Partial<Notification>) {
    Object.assign(this, props);
  }
}
