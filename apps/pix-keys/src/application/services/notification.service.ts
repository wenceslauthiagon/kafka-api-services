import { User } from '@zro/users/domain';
import { EmailState, SmsState } from '@zro/notifications/domain';
import { PixKey } from '@zro/pix-keys/domain';

export interface NotificationEmail {
  id: string;
  to: string;
  from: string;
  state: EmailState;
}

export interface NotificationSms {
  id: string;
  phoneNumber: string;
  state: SmsState;
}

export interface NotificationService {
  sendEmailCode(
    user: User,
    pixKey: PixKey,
    from: string,
    tag: string,
  ): Promise<NotificationEmail>;

  sendSmsCode(
    user: User,
    pixKey: PixKey,
    tag: string,
  ): Promise<NotificationSms>;
}
