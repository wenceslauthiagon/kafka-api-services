import { Domain } from '@zro/common';

export enum HolidayLevel {
  NATIONAL = 'nacional',
  USA = 'eua',
}

export enum HolidayType {
  HOLIDAY = 'feriado',
  OPTIONAL = 'facultativo',
}
export interface Holiday extends Domain<string> {
  id: string;
  startDate: Date;
  endDate: Date;
  name: string;
  type: HolidayType;
  level: HolidayLevel;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class HolidayEntity implements Holiday {
  id: string;
  startDate: Date;
  endDate: Date;
  name: string;
  type: HolidayType;
  level: HolidayLevel;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(props: Partial<Holiday>) {
    Object.assign(this, props);
  }
}
