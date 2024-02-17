import { ClaimReasonType, PixKey } from '@zro/pix-keys/domain';
import {
  PixKeyEvent,
  PixKeyEventEmitter,
  PixKeyReasonEvent,
} from '@zro/pix-keys/application';

export enum PixKeyEventType {
  ERROR = 'ERROR',
  READY = 'READY',
  ADD_READY = 'ADD_READY',
  DELETED = 'DELETED',
  DELETING = 'DELETING',
  PENDING = 'PENDING',
  PENDING_EXPIRED = 'PENDING_EXPIRED',
  CANCELED = 'CANCELED',
  CONFIRMED = 'CONFIRMED',
  NOT_CONFIRMED = 'NOT_CONFIRMED',
  CLAIM_PENDING = 'CLAIM_PENDING',
  CLAIM_PENDING_EXPIRED = 'CLAIM_PENDING_EXPIRED',
  CLAIM_DENIED = 'CLAIM_DENIED',
  CLAIM_CLOSING = 'CLAIM_CLOSING',
  CLAIM_CLOSED = 'CLAIM_CLOSED',
  CLAIM_NOT_CONFIRMED = 'CLAIM_NOT_CONFIRMED',
  PORTABILITY_PENDING = 'PORTABILITY_PENDING',
  PORTABILITY_OPENED = 'PORTABILITY_OPENED',
  PORTABILITY_STARTED = 'PORTABILITY_STARTED',
  PORTABILITY_CONFIRMED = 'PORTABILITY_CONFIRMED',
  PORTABILITY_CANCELING = 'PORTABILITY_CANCELING',
  PORTABILITY_CANCELED = 'PORTABILITY_CANCELED',
  PORTABILITY_READY = 'PORTABILITY_READY',
  PORTABILITY_REQUEST_CANCEL_OPENED = 'PORTABILITY_REQUEST_CANCEL_OPENED',
  PORTABILITY_REQUEST_CANCEL_STARTED = 'PORTABILITY_REQUEST_CANCEL_STARTED',
  PORTABILITY_REQUEST_CONFIRM_OPENED = 'PORTABILITY_REQUEST_CONFIRM_OPENED',
  PORTABILITY_REQUEST_CONFIRM_STARTED = 'PORTABILITY_REQUEST_CONFIRM_STARTED',
  PORTABILITY_REQUEST_PENDING = 'PORTABILITY_REQUEST_PENDING',
  PORTABILITY_REQUEST_AUTO_CONFIRMED = 'PORTABILITY_REQUEST_AUTO_CONFIRMED',
  PORTABILITY_PENDING_EXPIRED = 'PORTABILITY_PENDING_EXPIRED',
  OWNERSHIP_PENDING = 'OWNERSHIP_PENDING',
  OWNERSHIP_PENDING_EXPIRED = 'OWNERSHIP_PENDING_EXPIRED',
  OWNERSHIP_OPENED = 'OWNERSHIP_OPENED',
  OWNERSHIP_STARTED = 'OWNERSHIP_STARTED',
  OWNERSHIP_WAITING = 'OWNERSHIP_WAITING',
  OWNERSHIP_CONFIRMED = 'OWNERSHIP_CONFIRMED',
  OWNERSHIP_CANCELING = 'OWNERSHIP_CANCELING',
  OWNERSHIP_CANCELED = 'OWNERSHIP_CANCELED',
  OWNERSHIP_READY = 'OWNERSHIP_READY',
  OWNERSHIP_CONFLICT = 'OWNERSHIP_CONFLICT',
  STATE_HISTORY = 'STATE_HISTORY',
}

export interface PixKeyEventEmitterControllerInterface {
  /**
   * Call pixKeys microservice to emit pixKey.
   * @param eventName The event name.
   * @param event Data.
   */
  emitPixKeyEvent: <T extends PixKeyEvent>(
    eventName: PixKeyEventType,
    event: T,
  ) => void;
}

export class PixKeyEventEmitterController implements PixKeyEventEmitter {
  constructor(private eventEmitter: PixKeyEventEmitterControllerInterface) {}

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey The key with error state.
   */
  errorPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(PixKeyEventType.ERROR, event);
  }

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey The key with ready state.
   */
  readyPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(PixKeyEventType.READY, event);
  }

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey The key with ready state.
   */
  addReadyPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(PixKeyEventType.ADD_READY, event);
  }

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey The key with deleted state.
   */
  deletedPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(PixKeyEventType.DELETED, event);
  }

  /**
   * Emit deleting event.
   * @param pixKey The key with deleting state.
   */
  deletingPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(PixKeyEventType.DELETING, event);
  }

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey The key with canceled state.
   */
  canceledPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(PixKeyEventType.CANCELED, event);
  }

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey The key with confirmed state.
   */
  confirmedPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(PixKeyEventType.CONFIRMED, event);
  }

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey The key with pending state.
   */
  pendingPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(PixKeyEventType.PENDING, event);
  }

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey The key with portability pending expired state.
   */
  pendingExpiredPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(PixKeyEventType.PENDING_EXPIRED, event);
  }

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey The key with portability pending state.
   */
  portabilityPendingPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(
      PixKeyEventType.PORTABILITY_PENDING,
      event,
    );
  }

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey The key with claim pending state.
   */
  claimPendingPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(PixKeyEventType.CLAIM_PENDING, event);
  }

  /**
   * Call pixKeys microservice to emit pixKey.
   * @param pixKey The key with claim pending expired state.
   */
  claimPendingExpiredPixKey(pixKey: PixKey, reason: ClaimReasonType): void {
    const event: PixKeyReasonEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
      reason,
    };

    this.eventEmitter.emitPixKeyEvent(
      PixKeyEventType.CLAIM_PENDING_EXPIRED,
      event,
    );
  }

  /**
   * Emit claim denied event.
   * @param pixKey The key with claim denied state.
   */
  claimDeniedPixKey(pixKey: PixKey, reason: ClaimReasonType): void {
    const event: PixKeyReasonEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
      reason,
    };

    this.eventEmitter.emitPixKeyEvent<PixKeyReasonEvent>(
      PixKeyEventType.CLAIM_DENIED,
      event,
    );
  }

  /**
   * Emit claim closing event
   * @param pixKey The key with claim closing state.
   */
  claimClosingPixKey(pixKey: PixKey, reason: ClaimReasonType): void {
    const event: PixKeyReasonEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
      reason,
    };

    this.eventEmitter.emitPixKeyEvent<PixKeyReasonEvent>(
      PixKeyEventType.CLAIM_CLOSING,
      event,
    );
  }

  /**
   * Emit claim closed event
   * @param pixKey The key with claim closed state.
   */
  claimClosedPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(PixKeyEventType.CLAIM_CLOSED, event);
  }

  /**
   * Emit claim not confirmed event.
   * @param pixKey The key with claim not confirmed state.
   */
  claimNotConfirmedPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(
      PixKeyEventType.CLAIM_NOT_CONFIRMED,
      event,
    );
  }

  /**
   * Emit not confirmed event.
   * @param pixKey The key with not confirmed state.
   */
  notConfirmedPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(PixKeyEventType.NOT_CONFIRMED, event);
  }

  /**
   * Emit ownership pending event.
   * @param pixKey The key with ownership pending state.
   */
  ownershipPendingPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(PixKeyEventType.OWNERSHIP_PENDING, event);
  }

  /**
   * Emit ownership pending expired event.
   * @param pixKey  The key with ownership pending expired state.
   */
  ownershipPendingExpiredPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(
      PixKeyEventType.OWNERSHIP_PENDING_EXPIRED,
      event,
    );
  }

  /**
   * Emit ownership opened event.
   * @param pixKey The key with ownership opened state.
   */
  ownershipOpenedPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(PixKeyEventType.OWNERSHIP_OPENED, event);
  }

  /**
   * Emit ownership started event.
   * @param pixKey The key with ownership started state.
   */
  ownershipStartedPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(PixKeyEventType.OWNERSHIP_STARTED, event);
  }

  /**
   * Emit ownership waiting event.
   * @param pixKey The key with ownership waiting state.
   */
  ownershipWaitingPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(PixKeyEventType.OWNERSHIP_WAITING, event);
  }

  /**
   * Emit ownership confirmed event.
   * @param pixKey The key with ownership confirmed state.
   */
  ownershipConfirmedPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(
      PixKeyEventType.OWNERSHIP_CONFIRMED,
      event,
    );
  }

  /**
   * Emit ownership canceled event.
   * @param pixKey The key with ownership canceled state.
   */
  ownershipCanceledPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(
      PixKeyEventType.OWNERSHIP_CANCELED,
      event,
    );
  }

  /**
   * Emit ownership canceled event.
   * @param pixKey The key with ownership canceled state.
   */
  ownershipReadyPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(PixKeyEventType.OWNERSHIP_READY, event);
  }

  /**
   * Emit ownership conflict event.
   * @param pixKey The key with ownership ready state.
   */
  ownershipConflictPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(
      PixKeyEventType.OWNERSHIP_CONFLICT,
      event,
    );
  }

  /**
   * Emit portability opened event.
   * @param pixKey The key with portability opened state.
   */
  portabilityOpenedPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(
      PixKeyEventType.PORTABILITY_OPENED,
      event,
    );
  }

  /**
   * Emit portability started event.
   * @param pixKey The key with portability started state.
   */
  portabilityStartedPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(
      PixKeyEventType.PORTABILITY_STARTED,
      event,
    );
  }

  /**
   * Emit portability confirmed event.
   * @param pixKey The key with portability confirmed state.
   */
  portabilityConfirmedPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(
      PixKeyEventType.PORTABILITY_CONFIRMED,
      event,
    );
  }

  /**
   * Emit portability ready event.
   * @param pixKey The key with portability ready state.
   */
  portabilityReadyPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(PixKeyEventType.PORTABILITY_READY, event);
  }

  /**
   * Emit portability canceled event.
   * @param pixKey The key with portability canceled state.
   */
  portabilityCanceledPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(
      PixKeyEventType.PORTABILITY_CANCELED,
      event,
    );
  }

  /**
   * Emit portability request cancel opened event.
   * @param pixKey The key with portability request cancel opened state.
   */
  portabilityRequestCancelOpenedPixKey(
    pixKey: PixKey,
    reason: ClaimReasonType,
  ): void {
    const event: PixKeyReasonEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
      reason,
    };

    this.eventEmitter.emitPixKeyEvent<PixKeyReasonEvent>(
      PixKeyEventType.PORTABILITY_REQUEST_CANCEL_OPENED,
      event,
    );
  }

  /**
   * Emit portability request cancel started event.
   * @param pixKey The key with portability request cancel started state.
   */
  portabilityRequestCancelStartedPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(
      PixKeyEventType.PORTABILITY_REQUEST_CANCEL_STARTED,
      event,
    );
  }

  /**
   * Emit portability request confirm opened event.
   * @param pixKey The key with portability request confirm opened state.
   */
  portabilityRequestConfirmOpenedPixKey(
    pixKey: PixKey,
    reason: ClaimReasonType,
  ): void {
    const event: PixKeyReasonEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
      reason,
    };

    this.eventEmitter.emitPixKeyEvent<PixKeyReasonEvent>(
      PixKeyEventType.PORTABILITY_REQUEST_CONFIRM_OPENED,
      event,
    );
  }

  /**
   * Emit portability request confirm started event.
   * @param pixKey The key with portability request confirm started state.
   */
  portabilityRequestConfirmStartedPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(
      PixKeyEventType.PORTABILITY_REQUEST_CONFIRM_STARTED,
      event,
    );
  }

  /**
   * Emit portability request confirm started event.
   * @param pixKey The key with portability request confirm started state.
   */
  portabilityRequestPendingPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(
      PixKeyEventType.PORTABILITY_REQUEST_PENDING,
      event,
    );
  }

  /**
   * Emit portabitity request auto confirmed event.
   * @param pixKey The key with claim cancelled state.
   */
  portabilityRequestAutoConfirmedPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(
      PixKeyEventType.PORTABILITY_REQUEST_AUTO_CONFIRMED,
      event,
    );
  }

  /**
   * Emit portabitity canceling event.
   * @param pixKey The key with claim cancelled state.
   */
  portabilityCancelingPixKey(pixKey: PixKey, reason: ClaimReasonType): void {
    const event: PixKeyReasonEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
      reason,
    };

    this.eventEmitter.emitPixKeyEvent(
      PixKeyEventType.PORTABILITY_CANCELING,
      event,
    );
  }

  /**
   * Emit ownership canceling event.
   * @param pixKey The key with claim cancelled state.
   */
  ownershipCancelingPixKey(pixKey: PixKey, reason: ClaimReasonType): void {
    const event: PixKeyReasonEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
      reason,
    };

    this.eventEmitter.emitPixKeyEvent(
      PixKeyEventType.OWNERSHIP_CANCELING,
      event,
    );
  }

  /**
   * Emit portability pending expired event.
   * @param pixKey  The key with portability pending expired state.
   */
  portabilityPendingExpiredPixKey(pixKey: PixKey): void {
    const event: PixKeyEvent = {
      id: pixKey.id,
      state: pixKey.state,
      userId: pixKey.user.uuid,
    };

    this.eventEmitter.emitPixKeyEvent(
      PixKeyEventType.PORTABILITY_PENDING_EXPIRED,
      event,
    );
  }
}
