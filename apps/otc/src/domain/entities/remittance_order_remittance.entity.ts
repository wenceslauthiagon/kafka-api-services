import { Domain } from '@zro/common';
import { Remittance } from './remittance.entity';
import { RemittanceOrder } from './remittance_order.entity';

export interface RemittanceOrderRemittance extends Domain<string> {
  remittanceOrder: RemittanceOrder;
  remittance: Remittance;
  createdAt?: Date;
  updatedAt?: Date;
}

export class RemittanceOrderRemittanceEntity
  implements RemittanceOrderRemittance
{
  id: string;
  remittanceOrder: RemittanceOrder;
  remittance: Remittance;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<RemittanceOrderRemittance>) {
    Object.assign(this, props);
  }
}
