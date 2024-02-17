import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';

export interface UserLegalAdditionalInfo extends Domain<string> {
  user: User;
  cnae?: string;
  constitutionDesc?: string;
  employeeQty?: number;
  overseasBranchesQty?: number;
  isThirdPartyRelationship?: boolean;
  isCreditCardAdmin?: boolean;
  isPatrimonyTrust?: boolean;
  isPaymentFacilitator?: boolean;
  isRegulatedPld?: boolean;
  legalNaturityCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserLegalAdditionalInfoEntity implements UserLegalAdditionalInfo {
  id: string;
  user: User;
  cnae?: string;
  constitutionDesc?: string;
  employeeQty?: number;
  overseasBranchesQty?: number;
  isThirdPartyRelationship?: boolean;
  isCreditCardAdmin?: boolean;
  isPatrimonyTrust?: boolean;
  isPaymentFacilitator?: boolean;
  isRegulatedPld?: boolean;
  legalNaturityCode?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<UserLegalAdditionalInfo>) {
    Object.assign(this, props);
  }
}
