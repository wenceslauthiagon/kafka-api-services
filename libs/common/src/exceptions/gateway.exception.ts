import { DefaultException, IException } from '../helpers/error.helper';

export class GatewayException extends DefaultException {
  constructor(error: IException) {
    super(error);
  }
}
