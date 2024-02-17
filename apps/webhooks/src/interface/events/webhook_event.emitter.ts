import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  WebhookEventEmitter,
  WebhookEventPayload,
} from '@zro/webhooks/application';
import { WebhookEventState } from '@zro/webhooks/domain';

export enum WebhookEventType {
  CREATED = 'CREATED',
  CONFIRMED = 'CONFIRMED',
}

type TWebhookEventControllerEvent = WebhookEventPayload;

export class WebhookEventControllerEvent
  extends AutoValidator
  implements TWebhookEventControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsEnum(WebhookEventState)
  state: WebhookEventState;

  constructor(props: TWebhookEventControllerEvent) {
    super(props);
  }
}

export interface WebhookEventEmitterControllerInterface {
  /**
   * Emit webhook event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitWebhookEvent: (
    eventName: WebhookEventType,
    event: WebhookEventControllerEvent,
  ) => void;
}

export class WebhookEventEmitterController implements WebhookEventEmitter {
  constructor(private eventEmitter: WebhookEventEmitterControllerInterface) {}

  /**
   * Emit created event.
   * @param event Data.
   */
  created(event: WebhookEventPayload): void {
    const controllerEvent = new WebhookEventControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitWebhookEvent(
      WebhookEventType.CREATED,
      controllerEvent,
    );
  }

  confirmed(event: WebhookEventPayload): void {
    const controllerEvent = new WebhookEventControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitWebhookEvent(
      WebhookEventType.CONFIRMED,
      controllerEvent,
    );
  }
}
