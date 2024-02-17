import { Domain } from '@zro/common';
import { PersonType, User } from './user.entity';
import { AddressLegalRepresentor } from './address_legal_representor.entity';

export enum RepresentorType {
  PARTNER = 'PARTNER',
  ATTORNEY = 'ATTORNEY',
  ADMINISTRATOR = 'ADMINISTRATOR',
  OTHER = 'OTHER',
}

export interface UserLegalRepresentor extends Domain<string> {
  user: User;
  address?: AddressLegalRepresentor;
  personType: PersonType;
  document: string;
  name: string;
  birthDate: Date;
  type: RepresentorType;
  isPublicServer: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserLegalRepresentorEntity implements UserLegalRepresentor {
  id: string;
  user: User;
  address?: AddressLegalRepresentor;
  personType: PersonType;
  document: string;
  name: string;
  birthDate: Date;
  type: RepresentorType;
  isPublicServer: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<UserLegalRepresentor>) {
    Object.assign(this, props);
  }
}
