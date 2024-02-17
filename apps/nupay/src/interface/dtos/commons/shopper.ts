import { DocumentTypeEnum } from 'apps/nupay/src/domain';
import { Phone } from './phone';

export class Shopper {
  firstName: string;
  lastName: string;
  document: string;
  documentType: DocumentTypeEnum;
  email: string;
  phone: Phone;
  reference?: string;
  ip?: string;
  locale?: string;
}
