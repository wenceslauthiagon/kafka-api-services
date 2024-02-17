import { ExceptionTypes, DefaultException } from '@zro/common/helpers';

export type FixDecoded = {
  [key: string]: any;
};

export type FixDecodedHeader = FixDecoded;
export type FixDecodedBody = FixDecoded;
export type FixDecodedTrailer = FixDecoded;

export type FixDecodedMessage = {
  Name: string;
  Header: FixDecodedHeader;
  Body: FixDecodedBody;
  Trailer: FixDecodedTrailer;
};

export class FixParserException extends DefaultException {
  constructor(details?: string, data?: any) {
    super({
      message: 'Fix parser error',
      type: ExceptionTypes.SYSTEM,
      code: 'FIX_PARSER',
      data: { details, data },
    });
  }
}
