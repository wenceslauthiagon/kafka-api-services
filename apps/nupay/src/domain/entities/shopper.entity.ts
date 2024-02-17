import { Domain } from '@zro/common';
import { DocumentTypeEnum } from './document_type.enum';

export interface Shopper extends Domain<string> {
  firstName: string;
  lastName: string;
  document: string;
  documentType: DocumentTypeEnum;
  email: string;
  phone: string;
  reference?: string;
  ip?: string;
  locale?: string;
}

export class ShopperEntity implements Shopper {
  firstName: string;
  lastName: string;
  document: string;
  documentType: DocumentTypeEnum;
  email: string;
  phone: string;
  reference?: string;
  ip?: string;
  locale?: string;
  constructor(props: Partial<Shopper>) {
    Object.assign(this, props);
  }
}
