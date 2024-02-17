import { faker } from '@faker-js/faker/locale/pt_BR';

export class DefaultModel {}

export class DefaultModelInteger {
  id: number;

  constructor() {
    this.id = faker.datatype.number({ min: 1, max: 999999 });
  }
}

export class DefaultModelUUID {
  id: string;

  constructor() {
    this.id = faker.datatype.uuid();
  }
}
