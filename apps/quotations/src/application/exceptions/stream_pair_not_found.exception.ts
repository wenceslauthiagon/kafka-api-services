import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { StreamPair } from '@zro/quotations/domain';

@Exception(ExceptionTypes.USER, 'STREAM_PAIR_NOT_FOUND')
export class StreamPairNotFoundException extends DefaultException {
  constructor(streamPair: Partial<StreamPair>) {
    super({
      type: ExceptionTypes.USER,
      code: 'STREAM_PAIR_NOT_FOUND',
      data: streamPair,
    });
  }
}
