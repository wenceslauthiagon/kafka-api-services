import { IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  RemittanceExposureRuleEvent,
  RemittanceExposureRuleEventEmitter,
} from '@zro/otc/application';

export enum RemittanceExposureRuleEventType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
}

type TRemittanceExposureRuleControllerEvent = Pick<
  RemittanceExposureRuleEvent,
  'id'
>;

export class RemittanceExposureRuleControllerEvent
  extends AutoValidator
  implements TRemittanceExposureRuleControllerEvent
{
  @IsUUID(4)
  id: string;

  constructor(props: TRemittanceExposureRuleControllerEvent) {
    super(props);
  }
}

export interface RemittanceExposureRuleEventEmitterControllerInterface {
  /**
   * Emit remittance order event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitRemittanceExposureRuleEvent: (
    eventName: RemittanceExposureRuleEventType,
    event: RemittanceExposureRuleControllerEvent,
  ) => void;
}

export class RemittanceExposureRuleEventEmitterController
  implements RemittanceExposureRuleEventEmitter
{
  constructor(
    private eventEmitter: RemittanceExposureRuleEventEmitterControllerInterface,
  ) {}

  /**
   * Emit created event.
   * @param event Data.
   */
  createdRemittanceExposureRule(event: RemittanceExposureRuleEvent): void {
    const controllerEvent = new RemittanceExposureRuleControllerEvent({
      id: event.id,
    });

    this.eventEmitter.emitRemittanceExposureRuleEvent(
      RemittanceExposureRuleEventType.CREATED,
      controllerEvent,
    );
  }

  /**
   * Emit updated event.
   * @param event Data.
   */
  updatedRemittanceExposureRule(event: RemittanceExposureRuleEvent): void {
    const controllerEvent = new RemittanceExposureRuleControllerEvent({
      id: event.id,
    });

    this.eventEmitter.emitRemittanceExposureRuleEvent(
      RemittanceExposureRuleEventType.UPDATED,
      controllerEvent,
    );
  }
}
