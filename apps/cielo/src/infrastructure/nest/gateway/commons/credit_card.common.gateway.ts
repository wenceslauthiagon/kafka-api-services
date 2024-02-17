import { CieloCardOnFileCommon } from '@zro/cielo/infrastructure';

export interface CieloCreditCardCommon {
  CardNumber: string;
  Holder: string;
  ExpirationDate: string;
  SecurityCode: string;
  Brand: string;
  SaveCard: boolean;
  Alias: string;
  CardOnFile: CieloCardOnFileCommon;
}
