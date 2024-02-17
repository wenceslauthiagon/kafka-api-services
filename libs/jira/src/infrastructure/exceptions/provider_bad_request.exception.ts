import { ExceptionTypes, DefaultException } from '@zro/common/helpers';

export class ProviderBadRequestException extends DefaultException {
  constructor(errors: string[]) {
    super({
      message: 'Provider Bad Request error',
      type: ExceptionTypes.SYSTEM,
      code: 'PROVIDER_BAD_REQUEST',
      data: errors,
    });
  }
}
