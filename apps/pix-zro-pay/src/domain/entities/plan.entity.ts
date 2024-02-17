import { Domain } from '@zro/common';

/**
 * Plan.
 */
export interface Plan extends Domain<number> {
  name: string;
  feeCashinInCents?: number;
  feeCashinInPercent?: number;
  feeCashoutInCents?: number;
  feeCashoutInPercent?: number;
  feeRefundInCents?: number;
  feeRefundInPercent?: number;
  onHoldTimeInHours?: number;
  qrCodeMinValueInCents?: number;
  qrCodeMaxValueInCents?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class PlanEntity implements Plan {
  id: number;
  name: string;
  feeCashinInCents?: number;
  feeCashinInPercent?: number;
  feeCashoutInCents?: number;
  feeCashoutInPercent?: number;
  feeRefundInCents?: number;
  feeRefundInPercent?: number;
  onHoldTimeInHours?: number;
  qrCodeMinValueInCents?: number;
  qrCodeMaxValueInCents?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;

  constructor(props: Partial<Plan>) {
    Object.assign(this, props);
  }
}
