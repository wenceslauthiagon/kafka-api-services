import { Domain } from '@zro/common';

export interface AddressLegalRepresentor extends Domain<string> {
  zipCode: string;
  street: string;
  number: number;
  neighborhood: string;
  city: string;
  federativeUnit: string;
  country?: string;
  complement?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AddressLegalRepresentorEntity implements AddressLegalRepresentor {
  id: string;
  zipCode: string;
  street: string;
  number: number;
  neighborhood: string;
  city: string;
  federativeUnit: string;
  country?: string;
  complement?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<AddressLegalRepresentor>) {
    Object.assign(this, props);
  }
}
