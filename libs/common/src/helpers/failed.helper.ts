export interface Failed {
  code: string;
  message: string;
}

export class FailedEntity implements Failed {
  code: string;
  message: string;

  constructor(failed: Failed) {
    this.code = failed.code;
    this.message = failed.message;
  }
}
