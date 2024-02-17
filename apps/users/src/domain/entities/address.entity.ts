import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';

export interface Address extends Domain<number> {
  user: User;
  zipCode: string;
  street: string;
  number: number;
  neighborhood: string;
  city: string;
  federativeUnit: string;
  country: string;
  complement?: string;
  createdAt?: Date;
}

export class AddressEntity implements Address {
  id: number;
  user: User;
  zipCode: string;
  street: string;
  number: number;
  neighborhood: string;
  city: string;
  federativeUnit: string;
  country: string;
  complement?: string;
  createdAt?: Date;

  constructor(props: Partial<Address>) {
    Object.assign(this, props);
  }
}
