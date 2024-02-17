import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_LAUNCH_SITUATION')
export class JdpiLaunchSituationException extends DefaultException {
  constructor(data?: number) {
    super({
      message: 'Jdpi Launch Situation error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_LAUNCH_SITUATION',
      data,
    });
  }
}
