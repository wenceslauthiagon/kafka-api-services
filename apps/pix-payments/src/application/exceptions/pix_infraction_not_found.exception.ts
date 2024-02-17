import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixInfraction } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PIX_INFRACTION_NOT_FOUND')
export class PixInfractionNotFoundException extends DefaultException {
  constructor(data: Partial<PixInfraction>) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'PIX_INFRACTION_NOT_FOUND',
      data,
    });
  }
}
