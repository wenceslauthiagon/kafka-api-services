import { AuthorizationTypeEnum } from 'apps/nupay/src/domain';
import { FundingSourceTypeEnum } from 'apps/nupay/src/domain';

export class PaymentMethod {
  type: string;
  fundingSource?: FundingSourceTypeEnum;
  authorizationType?: AuthorizationTypeEnum;
}
