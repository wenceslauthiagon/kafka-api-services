import { DecodedPixKey } from '@zro/pix-keys/domain';

export type DecodedPixKeyEvent = Pick<
  DecodedPixKey,
  'id' | 'state' | 'key' | 'type' | 'personType'
> & { userId: string };

export interface DecodedPixKeyEventEmitter {
  /**
   * Call pix keys microservice to emit pending decoded pix key.
   * @param decodedPixKey Data.
   */
  pendingDecodedPixKey: (decodedPixKey: DecodedPixKey) => void;

  /**
   * Call pix keys microservice to emit confirmed decoded pix key.
   * @param decodedPixKey Data.
   */
  confirmedDecodedPixKey: (decodedPixKey: DecodedPixKey) => void;

  /**
   * Call pix keys microservice to emit error decoded pix key.
   * @param decodedPixKey Data.
   */
  errorDecodedPixKey: (decodedPixKey: DecodedPixKey) => void;
}
