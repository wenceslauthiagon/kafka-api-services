import { Domain } from '@zro/common';
import { AuthorizationTypeEnum } from './authorization_type.enum';
import { FundingSourceTypeEnum } from './funding_source_type.enum';

export interface PaymentMethod extends Domain<string> {
  type: string;
  fundingSource?: FundingSourceTypeEnum;
  authorizationType?: AuthorizationTypeEnum;
}

export class PaymentMethodEntity implements PaymentMethod {
  type: string;
  fundingSource?: FundingSourceTypeEnum;
  authorizationType?: AuthorizationTypeEnum;
  constructor(props: Partial<PaymentMethod>) {
    Object.assign(this, props);
  }
}
