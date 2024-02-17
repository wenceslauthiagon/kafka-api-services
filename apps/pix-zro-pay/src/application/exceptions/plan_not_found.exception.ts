import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Plan } from '@zro/pix-zro-pay/domain';

@Exception(ExceptionTypes.USER, 'PLAN_NOT_FOUND')
export class PlanNotFoundException extends DefaultException {
  constructor(data: Partial<Plan>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PLAN_NOT_FOUND',
      data,
    });
  }
}
