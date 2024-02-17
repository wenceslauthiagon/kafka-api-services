import { Domain } from '@zro/common';
import { Company } from '@zro/pix-zro-pay/domain';

/**
 * Client.
 */
export interface Client extends Domain<number> {
  name?: string;
  email?: string;
  document: string;
  company: Company;
  isBlacklisted?: boolean;
  isValid?: boolean;
  birthdate?: Date;
  isRestricted?: boolean;
  errorMessage?: string;
  verifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ClientEntity implements Client {
  id: number;
  name?: string;
  email?: string;
  document: string;
  company: Company;
  isBlacklisted?: boolean;
  isValid?: boolean;
  birthdate?: Date;
  isRestricted?: boolean;
  errorMessage?: string;
  verifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<Client>) {
    Object.assign(this, props);
  }
}
