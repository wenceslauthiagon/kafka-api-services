import { DefaultException, ExceptionTypes } from '@zro/common';

export class ReplayException extends DefaultException {
  constructor(hash: string, ttl: number) {
    super({
      type: ExceptionTypes.CONFLICT,
      code: 'REPLAY',
      data: { hash, ttl },
    });
  }
}
