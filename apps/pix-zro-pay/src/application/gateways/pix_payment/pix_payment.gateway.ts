import { CreateQrCodePixPaymentPspGateway } from './create_qr_code.gateway';
import { GetQrCodeByIdPixPaymentPspGateway } from './get_qr_code_by_id.gateway';

export type PixPaymentGateway = CreateQrCodePixPaymentPspGateway &
  GetQrCodeByIdPixPaymentPspGateway & {
    getProviderName(): string;
  };
