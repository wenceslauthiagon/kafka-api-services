import { Domain } from '@zro/common';
import { Operation } from '@zro/operations/domain';
import { PixInfraction, PixRefund } from '@zro/pix-payments/domain';
import { User } from '@zro/users/domain';

export enum PixInfractionRefundOperationState {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export interface PixInfractionRefundOperation extends Domain<string> {
  state: PixInfractionRefundOperationState;
  user: User;
  pixInfraction?: PixInfraction;
  pixRefund?: PixRefund;
  originalOperation: Operation;
  refundOperation: Operation;
  createdAt: Date;
  updatedAt: Date;
}

export class PixInfractionRefundOperationEntity
  implements PixInfractionRefundOperation
{
  id: string;
  state: PixInfractionRefundOperationState;
  user: User;
  pixInfraction?: PixInfraction;
  pixRefund?: PixRefund;
  originalOperation: Operation;
  refundOperation: Operation;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<PixInfractionRefundOperation>) {
    Object.assign(this, props);
  }
}
