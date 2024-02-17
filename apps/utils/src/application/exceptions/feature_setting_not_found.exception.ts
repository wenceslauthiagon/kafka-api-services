import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { FeatureSetting } from '@zro/utils/domain';

@Exception(ExceptionTypes.SYSTEM, 'FEATURE_SETTING_NOT_FOUND')
export class FeatureSettingNotFoundException extends DefaultException {
  constructor(data: Partial<FeatureSetting>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'FEATURE_SETTING_NOT_FOUND',
      data,
    });
  }
}
