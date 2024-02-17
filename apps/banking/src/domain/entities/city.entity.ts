import { Domain } from '@zro/common';

/**
 * City.
 */
export interface City extends Domain<string> {
  code: string;
  name: string;
  federativeUnitCode: string;
  federativeUnitName: string;
  federativeUnitAcronym: string;
  regionCode: string;
  regionName: string;
  regionAcronym: string;
  active?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class CityEntity implements City {
  id: string;
  code: string;
  name: string;
  federativeUnitCode: string;
  federativeUnitName: string;
  federativeUnitAcronym: string;
  regionCode: string;
  regionName: string;
  regionAcronym: string;
  active?: boolean;
  createdAt: Date;
  updatedAt?: Date;

  constructor(props: Partial<City>) {
    Object.assign(this, props);
  }
}
