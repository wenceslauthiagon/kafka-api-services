import { Admin } from '@zro/admin/domain';
import { EmailState } from '@zro/notifications/domain';

export interface NotificationEmail {
  id: string;
  to: string;
  from: string;
  state: EmailState;
}

export interface NotificationService {
  sendEmailCode(
    admin: Admin,
    verificationCode: string,
    from: string,
    tag: string,
  ): NotificationEmail | Promise<NotificationEmail>;
}
