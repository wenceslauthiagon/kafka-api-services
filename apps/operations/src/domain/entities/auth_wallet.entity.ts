import { AuthUser, Onboarding, User } from '@zro/users/domain';
import {
  PermissionAction,
  Wallet,
  WalletAccount,
} from '@zro/operations/domain';

type TUserResponse = Pick<User, 'id' | 'uuid' | 'active'>;

type TGeneralOnboardingResponse = Pick<
  Onboarding,
  'status' | 'createdAt' | 'updatedAt'
>;

type TBankingOnboardingResponse = Pick<
  Onboarding,
  'status' | 'accountNumber' | 'branch' | 'createdAt' | 'updatedAt'
>;

type TCryptoOnboardingResponse = Pick<
  Onboarding,
  'status' | 'createdAt' | 'updatedAt'
>;

type TDebitCardOnboardingResponse = Pick<
  Onboarding,
  'status' | 'createdAt' | 'updatedAt'
> &
  Pick<WalletAccount, 'accountNumber' | 'branchNumber' | 'accountId'>;

export type WalletGuardRequest = {
  id: string;
  user: AuthUser;
  wallet: AuthWallet;
  headers: { 'x-wallet-uuid': string };
};

export type AuthWallet = {
  id: Wallet['uuid'];
  state: Wallet['state'];
  user: TUserResponse;
  onboarding: {
    general: TGeneralOnboardingResponse;
    banking: TBankingOnboardingResponse;
    crypto: TCryptoOnboardingResponse;
    debitCard: TDebitCardOnboardingResponse;
  };
  permissions: Record<PermissionAction['tag'], boolean>;
};
