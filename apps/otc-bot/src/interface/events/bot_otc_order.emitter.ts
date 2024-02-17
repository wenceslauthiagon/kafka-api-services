import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { BotOtcOrderState } from '@zro/otc-bot/domain';
import {
  BotOtcOrderEvent,
  BotOtcOrderEventEmitter,
} from '@zro/otc-bot/application';

export enum BotOtcOrderEventType {
  PENDING = 'PENDING',
  SOLD = 'SOLD',
  ERROR = 'ERROR',
  FILLED = 'FILLED',
  COMPLETED = 'COMPLETED',
  COMPLETED_WITH_REMITTANCE = 'COMPLETED_WITH_REMITTANCE',
}

type TBotOtcOrderControllerEvent = Pick<BotOtcOrderEvent, 'id' | 'state'>;

export class BotOtcOrderControllerEvent
  extends AutoValidator
  implements TBotOtcOrderControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsEnum(BotOtcOrderState)
  state: BotOtcOrderState;

  constructor(props: TBotOtcOrderControllerEvent) {
    super(props);
  }
}

export interface BotOtcOrderEventEmitterControllerInterface {
  /**
   * Emit BotOtcOrder event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitBotOtcOrderEvent: (
    eventName: BotOtcOrderEventType,
    event: BotOtcOrderControllerEvent,
  ) => void;
}

export class BotOtcOrderEventEmitterController
  implements BotOtcOrderEventEmitter
{
  constructor(
    private eventEmitter: BotOtcOrderEventEmitterControllerInterface,
  ) {}

  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingBotOtcOrder(event: BotOtcOrderEvent): void {
    const controllerEvent = new BotOtcOrderControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitBotOtcOrderEvent(
      BotOtcOrderEventType.PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit sold event.
   * @param event Data.
   */
  soldBotOtcOrder(event: BotOtcOrderEvent): void {
    const controllerEvent = new BotOtcOrderControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitBotOtcOrderEvent(
      BotOtcOrderEventType.SOLD,
      controllerEvent,
    );
  }

  /**
   * Emit filled event.
   * @param event Data.
   */
  filledBotOtcOrder(event: BotOtcOrderEvent): void {
    const controllerEvent = new BotOtcOrderControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitBotOtcOrderEvent(
      BotOtcOrderEventType.FILLED,
      controllerEvent,
    );
  }

  /**
   * Emit completed event.
   * @param event Data.
   */
  completedBotOtcOrder(event: BotOtcOrderEvent): void {
    const controllerEvent = new BotOtcOrderControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitBotOtcOrderEvent(
      BotOtcOrderEventType.COMPLETED,
      controllerEvent,
    );
  }

  /**
   * Emit completed with remittance event.
   * @param event Data.
   */
  completedWithRemittanceBotOtcOrder(event: BotOtcOrderEvent): void {
    const controllerEvent = new BotOtcOrderControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitBotOtcOrderEvent(
      BotOtcOrderEventType.COMPLETED_WITH_REMITTANCE,
      controllerEvent,
    );
  }
}
