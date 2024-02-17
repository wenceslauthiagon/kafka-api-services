import { PixPaymentGateway } from '@zro/pix-zro-pay/application';

/**
 * GetPaymentGatewayService interface models a infrastructure level payment gateway
 * service required methods.
 */
export interface GetPaymentGatewayService {
  /**
   * Get associated gateway.
   * @returns Qr Code associated gateway.
   */
  getGateway(): PixPaymentGateway;
}
