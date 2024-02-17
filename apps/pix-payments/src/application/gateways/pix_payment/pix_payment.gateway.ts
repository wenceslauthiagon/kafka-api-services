import { CreatePaymentPixPaymentPspGateway } from './create_payment.gateway';
import { DecodeQrCodePixPaymentPspGateway } from './decode_qr_code.gateway';
import { CreateQrCodeStaticPixPaymentPspGateway } from './create_qr_code_static.gateway';
import { DeleteQrCodeStaticPixPaymentPspGateway } from './delete_qr_code_static.gateway';
import { CreatePixDevolutionPixPaymentPspGateway } from './create_pix_devolution.gateway';
import { GetPaymentPixPaymentPspGateway } from './get_payment.gateway';
import { CreatePixDevolutionRefundPixPaymentPspGateway } from './create_pix_devolution_refund.gateway';
import { CreateQrCodeDynamicPixPaymentPspGateway } from './create_qr_code_dynamic.gateway';
import { CreateQrCodeDynamicDueDatePixPaymentPspGateway } from './create_qr_code_dynamic_due_date.gateway';
import { CreateWarningPixDevolutionPixPaymentPspGateway } from './create_warning_pix_devolution.gateway';
import { GetPaymentByIdPixPaymentPspGateway } from './get_payment_by_id.gateway';
import { UpdateQrCodeDynamicDueDatePixPaymentPspGateway } from './update_qr_code_dynamic_due_date_pix_payment.gateway';

export type PixPaymentGateway = CreateQrCodeStaticPixPaymentPspGateway &
  DeleteQrCodeStaticPixPaymentPspGateway &
  CreatePixDevolutionPixPaymentPspGateway &
  CreatePaymentPixPaymentPspGateway &
  DecodeQrCodePixPaymentPspGateway &
  GetPaymentPixPaymentPspGateway &
  CreatePixDevolutionRefundPixPaymentPspGateway &
  CreateQrCodeDynamicPixPaymentPspGateway &
  CreateQrCodeDynamicDueDatePixPaymentPspGateway &
  CreateWarningPixDevolutionPixPaymentPspGateway &
  GetPaymentByIdPixPaymentPspGateway &
  UpdateQrCodeDynamicDueDatePixPaymentPspGateway;
