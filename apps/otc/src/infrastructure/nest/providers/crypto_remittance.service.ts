import { CryptoRemittanceGateway } from '@zro/otc/application';

/**
 * ConversionService interface models a infrastructure level stream
 * quotation service required methods.
 */
export interface CryptoRemittanceService {
  /**
   * Get associated gateway.
   * @returns Stream quotation associated gateway.
   */
  getGateway(): CryptoRemittanceGateway;
}
