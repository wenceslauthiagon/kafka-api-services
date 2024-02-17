import { ClaimReasonType, KeyState, PixKey } from '@zro/pix-keys/domain';

export interface PixKeyEvent {
  id: string;
  state: KeyState;
  userId: string;
}

export type PixKeyReasonEvent = PixKeyEvent & { reason: ClaimReasonType };

export interface PixKeyEventEmitter {
  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey Data.
   */
  errorPixKey: (pixKey: PixKey) => void;

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey Data.
   */
  readyPixKey: (pixKey: PixKey) => void;

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey Data.
   */
  addReadyPixKey: (pixKey: PixKey) => void;

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey Data.
   */
  canceledPixKey: (pixKey: PixKey) => void;

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey Data.
   */
  confirmedPixKey: (pixKey: PixKey) => void;

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey Data.
   */
  pendingPixKey: (pixKey: PixKey) => void;

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey Data.
   */
  pendingExpiredPixKey: (pixKey: PixKey) => void;

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey Data.
   */
  portabilityPendingPixKey: (pixKey: PixKey) => void;

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey Data.
   */
  claimPendingPixKey: (pixKey: PixKey) => void;

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey Data.
   */
  claimPendingExpiredPixKey: (pixKey: PixKey, reason: ClaimReasonType) => void;

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey Data.
   */
  deletedPixKey: (pixKey: PixKey) => void;

  /**
   * Emit deleting event.
   * @param pixKey Data.
   */
  deletingPixKey: (pixKey: PixKey) => void;

  /**
   * Emit claim denied event.
   * @param pixKey The key with claim denied state.
   */
  claimDeniedPixKey: (pixKey: PixKey, reason: ClaimReasonType) => void;

  /**
   * Emit claim closing event.
   * @param pixKey The key with claim closing state.
   */
  claimClosingPixKey: (pixKey: PixKey, reason: ClaimReasonType) => void;

  /**
   * Emit claim closed event.
   * @param pixKey The key with claim closed state.
   */
  claimClosedPixKey: (pixKey: PixKey) => void;

  /**
   * Emit claim not confirmed event.
   * @param pixKey The key with claim not confirmed state.
   */
  claimNotConfirmedPixKey: (pixKey: PixKey) => void;

  /**
   * Emit not confirmed event.
   * @param pixKey The key with not confirmed state.
   */
  notConfirmedPixKey: (pixKey: PixKey) => void;

  /**
   * Emit ownership pending event.
   * @param pixKey The key with ownership pending state.
   */
  ownershipPendingPixKey: (pixKey: PixKey) => void;

  /**
   * Emit ownership pending expired event.
   * @param pixKey Data.
   */
  ownershipPendingExpiredPixKey: (pixKey: PixKey) => void;

  /**
   * Emit ownership opened event.
   * @param pixKey The key with ownership opened state.
   */
  ownershipOpenedPixKey: (pixKey: PixKey) => void;

  /**
   * Emit ownership started event.
   * @param pixKey The key with ownership started state.
   */
  ownershipStartedPixKey: (pixKey: PixKey) => void;

  /**
   * Emit ownership waiting event.
   * @param pixKey The key with ownership waiting state.
   */
  ownershipWaitingPixKey: (pixKey: PixKey) => void;

  /**
   * Emit ownership confirmed event.
   * @param pixKey The key with ownership confirmed state.
   */
  ownershipConfirmedPixKey: (pixKey: PixKey) => void;

  /**
   * Emit ownership canceled event.
   * @param pixKey The key with ownership canceled state.
   */
  ownershipCanceledPixKey: (pixKey: PixKey) => void;

  /**
   * Emit ownership ready event.
   * @param pixKey The key with ownership ready state.
   */
  ownershipReadyPixKey: (pixKey: PixKey) => void;

  /**
   * Emit ownership conflict event.
   * @param pixKey The key with ownership ready state.
   */
  ownershipConflictPixKey: (pixKey: PixKey) => void;

  /**
   * Emit portability opened event.
   * @param pixKey The key with portability opened state.
   */
  portabilityOpenedPixKey: (pixKey: PixKey) => void;

  /**
   * Emit portability started event.
   * @param pixKey The key with portability started state.
   */
  portabilityStartedPixKey: (pixKey: PixKey) => void;

  /**
   * Emit portability confirmed event.
   * @param pixKey The key with portability confirmed state.
   */
  portabilityConfirmedPixKey: (pixKey: PixKey) => void;

  /**
   * Emit portability ready event.
   * @param pixKey The key with portability ready state.
   */
  portabilityReadyPixKey: (pixKey: PixKey) => void;

  /**
   * Emit portability canceled event.
   * @param pixKey The key with portability canceled state.
   */
  portabilityCanceledPixKey: (pixKey: PixKey) => void;

  /**
   * Emit portability request cancel opened event.
   * @param pixKey The key with portability request cancel opened state.
   */
  portabilityRequestCancelOpenedPixKey: (
    pixKey: PixKey,
    reason: ClaimReasonType,
  ) => void;

  /**
   * Emit portability request cancel started event.
   * @param pixKey The key with portability request cancel started state.
   */
  portabilityRequestCancelStartedPixKey: (pixKey: PixKey) => void;

  /**
   * Emit portability request confirm opened event.
   * @param pixKey The key with portability request confirm opened state.
   */
  portabilityRequestConfirmOpenedPixKey: (
    pixKey: PixKey,
    reason: ClaimReasonType,
  ) => void;

  /**
   * Emit portability request confirm started event.
   * @param pixKey The key with portability request confirm started state.
   */
  portabilityRequestConfirmStartedPixKey: (pixKey: PixKey) => void;

  /**
   * Emit portability request pending event.
   * @param pixKey The key with portability request pending state.
   */
  portabilityRequestPendingPixKey: (pixKey: PixKey) => void;

  /**
   * Emit portabitity request auto confirmed event.
   * @param pixKey The key with claim cancelled state.
   */
  portabilityRequestAutoConfirmedPixKey: (pixKey: PixKey) => void;

  /**
   * Emit portabitity canceling event.
   * @param pixKey The key with claim cancelled state.
   */
  portabilityCancelingPixKey: (pixKey: PixKey, reason: ClaimReasonType) => void;

  /**
   * Emit portability pending expired event.
   * @param pixKey The key with portability pending state.
   */
  portabilityPendingExpiredPixKey: (pixKey: PixKey) => void;

  /**
   * Emit ownership canceling event.
   * @param pixKey The key with claim cancelled state.
   */
  ownershipCancelingPixKey: (pixKey: PixKey, reason: ClaimReasonType) => void;
}
