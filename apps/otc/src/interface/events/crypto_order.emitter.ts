import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  CryptoOrderEvent,
  CryptoOrderEventEmitter,
} from '@zro/otc/application';
import { CryptoOrderState } from '@zro/otc/domain';
import { User } from '@zro/users/domain';

export enum CryptoOrderEventType {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  ERROR = 'ERROR',
}

type UserId = User['uuid'];

type TCryptoOrderControllerEvent = { userId: UserId } & Pick<
  CryptoOrderEvent,
  'id' | 'state'
>;

export class CryptoOrderControllerEvent
  extends AutoValidator
  implements TCryptoOrderControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  @IsOptional()
  userId: string;

  @IsEnum(CryptoOrderState)
  state: CryptoOrderState;

  constructor(props: TCryptoOrderControllerEvent) {
    super(props);
  }
}

export interface CryptoOrderEventEmitterControllerInterface {
  /**
   * Emit cryptoOrder event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitCryptoOrderEvent: (
    eventName: CryptoOrderEventType,
    event: CryptoOrderControllerEvent,
  ) => void;
}

export class CryptoOrderEventEmitterController
  implements CryptoOrderEventEmitter
{
  constructor(
    private eventEmitter: CryptoOrderEventEmitterControllerInterface,
  ) {}

  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingCryptoOrder(event: CryptoOrderEvent): void {
    const controllerEvent = new CryptoOrderControllerEvent({
      id: event.id,
      state: event.state,
      ...(event.user?.uuid && { userId: event.user.uuid }),
    });

    this.eventEmitter.emitCryptoOrderEvent(
      CryptoOrderEventType.PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit confirmed event.
   * @param event Data.
   */
  confirmedCryptoOrder(event: CryptoOrderEvent): void {
    const controllerEvent = new CryptoOrderControllerEvent({
      id: event.id,
      state: event.state,
      ...(event.user?.uuid && { userId: event.user.uuid }),
    });

    this.eventEmitter.emitCryptoOrderEvent(
      CryptoOrderEventType.CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit failed event.
   * @param event Data.
   */
  failedCryptoOrder(event: CryptoOrderEvent): void {
    const controllerEvent = new CryptoOrderControllerEvent({
      id: event.id,
      state: event.state,
      ...(event.user?.uuid && { userId: event.user.uuid }),
    });

    this.eventEmitter.emitCryptoOrderEvent(
      CryptoOrderEventType.FAILED,
      controllerEvent,
    );
  }

  /**
   * Emit error event.
   * @param event Data.
   */
  errorCryptoOrder(event: CryptoOrderEvent): void {
    const controllerEvent = new CryptoOrderControllerEvent({
      id: event.id,
      state: event.state,
      ...(event.user?.uuid && { userId: event.user.uuid }),
    });

    this.eventEmitter.emitCryptoOrderEvent(
      CryptoOrderEventType.ERROR,
      controllerEvent,
    );
  }
}
