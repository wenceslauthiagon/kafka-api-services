import { DefaultException, ExceptionTypes } from '@zro/common';

export class MissingEnvVarException extends DefaultException {
  constructor(missing: string | number | string[]) {
    super({
      message: 'Missing env var: ' + missing,
      type: ExceptionTypes.SYSTEM,
      code: 'MISSING_ENV_VAR',
      data: missing,
    });
  }
}
