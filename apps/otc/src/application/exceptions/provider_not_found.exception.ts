import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Provider } from '@zro/otc/domain';

@Exception(ExceptionTypes.USER, 'PROVIDER_NOT_FOUND')
export class ProviderNotFoundException extends DefaultException {
  constructor(provider: Partial<Provider>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PROVIDER_NOT_FOUND',
      data: provider,
    });
  }
}
