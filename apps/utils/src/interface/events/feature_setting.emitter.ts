import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  FeatureSettingEvent,
  FeatureSettingEventEmitter,
} from '@zro/utils/application';
import { FeatureSettingName, FeatureSettingState } from '@zro/utils/domain';

export enum FeatureSettingEventType {
  UPDATE_CREATE_EXCHANGE_QUOTATION = 'UPDATE_CREATE_EXCHANGE_QUOTATION',
}

type TFeatureSettingControllerEvent = Pick<
  FeatureSettingEvent,
  'id' | 'name' | 'state'
>;

export class FeatureSettingControllerEvent
  extends AutoValidator
  implements TFeatureSettingControllerEvent
{
  @IsUUID()
  id: string;

  @IsEnum(FeatureSettingName)
  name: FeatureSettingName;

  @IsEnum(FeatureSettingState)
  state: FeatureSettingState;

  constructor(props: TFeatureSettingControllerEvent) {
    super(props);
  }
}

export interface FeatureSettingEventEmitterControllerInterface {
  /**
   * Emit user event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitFeatureSettingEvent(
    eventName: FeatureSettingEventType,
    event: FeatureSettingControllerEvent,
  ): void;
}

export class FeatureSettingEventEmitterController
  implements FeatureSettingEventEmitter
{
  constructor(
    private eventEmitter: FeatureSettingEventEmitterControllerInterface,
  ) {}

  /**
   * Emit updated feature setting request event.
   * @param event Data.
   */
  updateFeatureCreateExchangeQuotation(event: FeatureSettingEvent): void {
    const controllerEvent = new FeatureSettingControllerEvent({
      id: event.id,
      name: event.name,
      state: event.state,
    });

    this.eventEmitter.emitFeatureSettingEvent(
      FeatureSettingEventType.UPDATE_CREATE_EXCHANGE_QUOTATION,
      controllerEvent,
    );
  }
}
