import { Domain } from '@zro/common';
import { Currency } from '@zro/operations/domain';

export interface StreamPair extends Domain<string> {
  baseCurrency: Currency;
  quoteCurrency: Currency;
  priority: number;
  gatewayName: string;
  active: boolean;
  composedBy?: StreamPair[];

  isSynthetic(): boolean;
}

export class StreamPairEntity implements StreamPair {
  id: string;
  baseCurrency: Currency;
  quoteCurrency: Currency;
  priority: number;
  gatewayName: string;
  active: boolean;
  composedBy?: StreamPair[];

  constructor(props: Partial<StreamPair>) {
    Object.assign(this, props);
  }

  isSynthetic(): boolean {
    return !!this.composedBy?.length;
  }
}
