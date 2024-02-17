import { PixKeyClaim } from '@zro/pix-keys/domain';

export type PixKeyClaimEvent = Pick<
  PixKeyClaim,
  'id' | 'key' | 'type' | 'status'
>;

export interface PixKeyClaimEventEmitter {
  /**
   * Call pixKeyClaims microservice to emit pixKeyClaim.
   * @param pixKeyClaim Data.
   */
  readyPixKeyClaim: (pixKeyClaim: PixKeyClaim) => void;
}
