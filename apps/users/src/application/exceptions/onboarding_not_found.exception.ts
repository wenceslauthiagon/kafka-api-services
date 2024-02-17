import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Onboarding } from '@zro/users/domain';

@Exception(ExceptionTypes.USER, 'ONBOARDING_NOT_FOUND')
export class OnboardingNotFoundException extends DefaultException {
  constructor(data: Partial<Onboarding>) {
    super({
      type: ExceptionTypes.USER,
      code: 'ONBOARDING_NOT_FOUND',
      data,
    });
  }
}
