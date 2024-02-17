import { Domain } from '@zro/common';
import { Company } from '@zro/pix-zro-pay/domain';

/**
 * CompanyPolicy.
 */
export interface CompanyPolicy extends Domain<number> {
  company: Company;
  shouldRejectPaidByThirdPartyWhenCpf: boolean;
  shouldRejectPaidByThirdPartyWhenCnpj: boolean;
  maximumValueToStartRefundingPerClient?: number;
  qrcodeExpirationTimeInSeconds: number;
  webhookVersion: string;
  verifyKycTransactions: boolean;
  sendKycTransactions: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CompanyPolicyEntity implements CompanyPolicy {
  id: number;
  company: Company;
  shouldRejectPaidByThirdPartyWhenCpf: boolean;
  shouldRejectPaidByThirdPartyWhenCnpj: boolean;
  maximumValueToStartRefundingPerClient?: number;
  qrcodeExpirationTimeInSeconds: number;
  webhookVersion: string;
  verifyKycTransactions: boolean;
  sendKycTransactions: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<CompanyPolicy>) {
    Object.assign(this, props);
  }
}
