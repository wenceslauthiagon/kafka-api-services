import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixInfraction } from '@zro/pix-payments/domain';
@Exception(ExceptionTypes.ADMIN, 'PIX_INFRACTION_INVALID_STATE')
export class PixInfractionInvalidStateException extends DefaultException {
  constructor(data: Partial<PixInfraction>) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'PIX_INFRACTION_INVALID_STATE',
      data,
    });
  }
}
