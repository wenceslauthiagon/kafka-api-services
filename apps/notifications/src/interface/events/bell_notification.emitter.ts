import { IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { BellNotification } from '@zro/notifications/domain';
import { BellNotificationEventEmitter } from '@zro/notifications/application';

export enum BellNotificationEventType {
  CREATED = 'CREATED',
  SENT = 'SENT',
}

type TBellNotificationControllerEvent = Pick<BellNotification, 'uuid'>;

export class BellNotificationControllerEvent
  extends AutoValidator
  implements TBellNotificationControllerEvent
{
  @IsUUID(4)
  uuid: string;

  constructor(props: TBellNotificationControllerEvent) {
    super(props);
  }
}

export interface BellNotificationEventEmitterControllerInterface {
  /**
   * Emit bell notification event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitCreatedEvent: (
    eventName: BellNotificationEventType,
    event: BellNotificationControllerEvent,
  ) => void;

  /**
   * Sent bell notification event.
   * @param eventName The event name.
   * @param event Data.
   */
  sentCreatedEvent: (
    eventName: BellNotificationEventType,
    event: BellNotificationControllerEvent,
  ) => void;
}

export class BellNotificationEventEmitterController
  implements BellNotificationEventEmitter
{
  constructor(
    private eventEmitter: BellNotificationEventEmitterControllerInterface,
  ) {}
  /**
   * Emit CREATED event.
   * @param event Data.
   */
  createdPushNotification(event: TBellNotificationControllerEvent): void {
    const controllerEvent = new BellNotificationControllerEvent({
      uuid: event.uuid,
    });

    this.eventEmitter.emitCreatedEvent(
      BellNotificationEventType.CREATED,
      controllerEvent,
    );
  }

  /**
   * Emit SENT event.
   * @param event Data.
   */
  sentPushNotification(event: TBellNotificationControllerEvent): void {
    const controllerEvent = new BellNotificationControllerEvent({
      uuid: event.uuid,
    });

    this.eventEmitter.sentCreatedEvent(
      BellNotificationEventType.SENT,
      controllerEvent,
    );
  }
}
