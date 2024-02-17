import { DecodedPixKey } from '@zro/pix-keys/domain';
import {
  DecodedPixKeyEvent,
  DecodedPixKeyEventEmitter,
} from '@zro/pix-keys/application';

export enum DecodedPixKeyEventType {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ERROR = 'ERROR',
}

export interface DecodedPixKeyEventEmitterControllerInterface {
  /**
   * Call decodedPixKeys microservice to emit decodedPixKey.
   * @param eventName The event name.
   * @param event Data.
   */
  emitDecodedPixKeyEvent: <T extends DecodedPixKeyEvent>(
    eventName: DecodedPixKeyEventType,
    event: T,
  ) => void;
}

export class DecodedPixKeyEventEmitterController
  implements DecodedPixKeyEventEmitter
{
  constructor(
    private eventEmitter: DecodedPixKeyEventEmitterControllerInterface,
  ) {}

  /**
   * Call decodedPixKeys microservice to emit decodedPixKey.
   * @param decodedPixKey Data.
   */
  errorDecodedPixKey(decodedPixKey: DecodedPixKey): void {
    const event: DecodedPixKeyEvent = {
      id: decodedPixKey.id,
      state: decodedPixKey.state,
      userId: decodedPixKey.user.uuid,
      key: decodedPixKey.key,
      type: decodedPixKey.type,
      personType: decodedPixKey.personType,
    };

    this.eventEmitter.emitDecodedPixKeyEvent(
      DecodedPixKeyEventType.ERROR,
      event,
    );
  }

  /**
   * Call decodedPixKeys microservice to emit decodedPixKey.
   * @param decodedPixKey Data.
   */
  pendingDecodedPixKey(decodedPixKey: DecodedPixKey): void {
    const event: DecodedPixKeyEvent = {
      id: decodedPixKey.id,
      state: decodedPixKey.state,
      userId: decodedPixKey.user.uuid,
      key: decodedPixKey.key,
      type: decodedPixKey.type,
      personType: decodedPixKey.personType,
    };

    this.eventEmitter.emitDecodedPixKeyEvent(
      DecodedPixKeyEventType.PENDING,
      event,
    );
  }

  /**
   * Call decodedPixKeys microservice to emit decodedPixKey.
   * @param decodedPixKey Data.
   */
  confirmedDecodedPixKey(decodedPixKey: DecodedPixKey): void {
    const event: DecodedPixKeyEvent = {
      id: decodedPixKey.id,
      state: decodedPixKey.state,
      userId: decodedPixKey.user.uuid,
      key: decodedPixKey.key,
      type: decodedPixKey.type,
      personType: decodedPixKey.personType,
    };

    this.eventEmitter.emitDecodedPixKeyEvent(
      DecodedPixKeyEventType.CONFIRMED,
      event,
    );
  }
}
