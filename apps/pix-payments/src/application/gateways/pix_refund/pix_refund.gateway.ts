import { CancelPixRefundPspGateway } from './cancel_pix_refund.gateway';
import { ClosePixRefundPspGateway } from './close_pix_refund.gateway';
import { GetPixRefundPspGateway } from './get_pix_refund.gateway';

export type PixRefundGateway = CancelPixRefundPspGateway &
  ClosePixRefundPspGateway &
  GetPixRefundPspGateway;
