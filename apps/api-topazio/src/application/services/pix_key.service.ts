import { KeyState, KeyType } from '@zro/pix-keys/domain';

export interface GetByKeyPixKeyServiceResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export interface PixKeyService {
  /**
   * Get pix key by Key.
   * @param key The pix key.
   * @returns void.
   */
  getPixKeyByKey(key: string): Promise<GetByKeyPixKeyServiceResponse>;

  /**
   * Send claim portability canceled.
   * @param key The pix key.
   * @returns void.
   */
  cancelPortabilityClaim(key: string): Promise<void>;

  /**
   * Send claim portability completed.
   * @param key The pix key.
   * @returns void.
   */
  completePortabilityClaim(key: string): Promise<void>;

  /**
   * Send claim portability confirmed.
   * @param key The pix key.
   * @returns void.
   */
  confirmPortabilityClaim(key: string): Promise<void>;

  /**
   * Send claim ownership waiting.
   * @param key The pix key.
   * @returns void.
   */
  waitOwnershipClaim(key: string): Promise<void>;

  /**
   * Send claim ownership completed.
   * @param key The pix key.
   * @returns void.
   */
  completeOwnershipClaim(key: string): Promise<void>;

  /**
   * Send claim ownership canceled.
   * @param key The pix key.
   * @returns void.
   */
  cancelOwnershipClaim(key: string): Promise<void>;

  /**
   * Send claim ownership confirmed.
   * @param key The pix key.
   * @returns void.
   */
  confirmOwnershipClaim(key: string): Promise<void>;

  /**
   * Send claim ownership ready.
   * @param key The pix key.
   * @returns void.
   */
  readyOwnershipClaim(key: string): Promise<void>;

  /**
   * Send claim portability ready.
   * @param key The pix key.
   * @returns void.
   */
  readyPortabilityClaim(key: string): Promise<void>;

  /**
   * Send claim closing completed.
   * @param key The pix key.
   * @returns void.
   */
  completeClaimClosing(key: string): Promise<void>;
}
