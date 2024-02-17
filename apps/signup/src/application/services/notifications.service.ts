import { Signup } from '@zro/signup/domain';
import { SmsState } from '@zro/notifications/domain';

export interface NotificationSms {
  id: string;
  phoneNumber: string;
  state: SmsState;
}

export interface NotificationService {
  /**
   * Call Notification for send sms.
   * @param signup Signup.
   * @param tag SMS template tag.
   */
  sendSmsCode(
    signup: Signup,
    tag: string,
  ): NotificationSms | Promise<NotificationSms>;

  /**
   * Call Notification for send email.
   * @param userForgotPassword User forgot password.
   * @param tag The email tag.
   */
  sendEmailCode(signup: Signup, tag: string, emailFrom: string): Promise<void>;
}
