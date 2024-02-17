export interface Occupation {
  codCbo: number;
  cbo: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class OccupationEntity implements Occupation {
  codCbo: number;
  cbo: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<Occupation>) {
    Object.assign(this, props);
  }
}
