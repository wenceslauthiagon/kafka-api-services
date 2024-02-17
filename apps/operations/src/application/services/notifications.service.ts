import { EmailState } from '@zro/notifications/domain';
import { WalletInvitation } from '@zro/operations/domain';
import { User } from '@zro/users/domain';

export interface NotificationEmail {
  id: string;
  to: string;
  from: string;
  state: EmailState;
}

export interface NotificationService {
  sendEmailWalletInvitation(
    walletInvitation: WalletInvitation,
    user: User,
    tag: string,
    url: string,
    from: string,
  ): NotificationEmail | Promise<NotificationEmail>;
}
