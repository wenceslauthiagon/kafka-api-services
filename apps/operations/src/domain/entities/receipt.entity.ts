import { Operation } from './operation.entity';

type ResponseValueObject = { [key: string]: string };
type ResponseValueList = ResponseValueObject[];
export type PaymentData = { [key: string]: ResponseValueList }[];

export interface Receipt {
  paymentData: PaymentData;
  paymentTitle: string;
  operationId: Operation['id'];
  isScheduled?: boolean;
  activeDevolution?: boolean;
}

export class ReceiptEntity implements Receipt {
  paymentData: PaymentData;
  paymentTitle: string;
  operationId: Operation['id'];
  isScheduled?: boolean;
  activeDevolution?: boolean;

  constructor(props: Partial<Receipt>) {
    Object.assign(this, props);
  }
}
