import { PixKeyClaim } from '@zro/pix-keys/domain';
import {
  PixKeyClaimEvent,
  PixKeyClaimEventEmitter,
} from '@zro/pix-keys/application';

export enum PixKeyClaimEventType {
  READY = 'READY',
}

export interface PixKeyClaimEventEmitterControllerInterface {
  /**
   * Call pixKeyClaims microservice to emit pixKeyClaim.
   * @param eventName The event name.
   * @param event Data.
   */
  emitPixKeyClaimEvent: <T extends PixKeyClaimEvent>(
    eventName: PixKeyClaimEventType,
    event: T,
  ) => void;
}

export class PixKeyClaimEventEmitterController
  implements PixKeyClaimEventEmitter
{
  constructor(
    private eventEmitter: PixKeyClaimEventEmitterControllerInterface,
  ) {}

  /**
   * Call pixKeyClaims microservice to emit pixKeyClaim.
   * @param claim Data.
   */
  readyPixKeyClaim(claim: PixKeyClaim): void {
    const event: PixKeyClaimEvent = {
      id: claim.id,
      key: claim.key,
      type: claim.type,
      status: claim.status,
    };

    this.eventEmitter.emitPixKeyClaimEvent(PixKeyClaimEventType.READY, event);
  }
}
