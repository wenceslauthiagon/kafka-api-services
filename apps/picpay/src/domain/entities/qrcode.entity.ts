import { Domain } from '@zro/common';

export interface Qrcode extends Domain<string> {
  content: string;
  base64: string;
}

export class QrcodeEntity implements Qrcode {
  content: string;
  base64: string;

  constructor(props: Partial<Qrcode>) {
    Object.assign(this, props);
  }
}
