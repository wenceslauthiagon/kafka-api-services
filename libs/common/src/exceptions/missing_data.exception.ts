import { DefaultException, ExceptionTypes } from '@zro/common';

export class MissingDataException extends DefaultException {
  constructor(missingData: string[] = []) {
    super({
      message: 'Missing data: ' + missingData?.filter((x) => x).join(', '),
      type: ExceptionTypes.USER,
      code: 'MISSING_DATA',
      data: missingData?.filter((x) => x),
    });
  }
}
