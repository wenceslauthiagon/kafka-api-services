import { CieloAddressCommon } from '@zro/cielo/infrastructure';

export interface CieloCustomerCommon {
  Name: string;
  Identity: string;
  IdentityType: string;
  Email: string;
  Address?: CieloAddressCommon;
}
