import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'CRYPTO_REMITTANCE_GATEWAY_NOT_FOUND')
export class CryptoRemittanceGatewayNotFoundException extends DefaultException {
  constructor(gatewayName: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'CRYPTO_REMITTANCE_GATEWAY_NOT_FOUND',
      data: gatewayName,
    });
  }
}
