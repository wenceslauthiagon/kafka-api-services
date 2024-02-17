import { UserForgotPassword } from '@zro/users/domain';

export interface NotificationService {
  /**
   * Call Notification for send sms.
   * @param userForgotPassword User forgot password.
   * @param tag The sms tag.
   */
  sendSms(userForgotPassword: UserForgotPassword, tag: string): Promise<void>;

  /**
   * Call Notification for send email.
   * @param userForgotPassword User forgot password.
   * @param tag The email tag.
   */
  sendEmail(
    userForgotPassword: UserForgotPassword,
    emailFrom: string,
    tag: string,
  ): Promise<void>;
}
