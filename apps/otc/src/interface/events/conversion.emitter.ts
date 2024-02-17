import { IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User } from '@zro/users/domain';
import { ConversionEvent, ConversionEventEmitter } from '@zro/otc/application';

export enum ConversionEventType {
  READY = 'READY',
}

type UserId = User['uuid'];

type TConversionControllerEvent = { userId: UserId } & Pick<
  ConversionEvent,
  'id'
>;

export class ConversionControllerEvent
  extends AutoValidator
  implements TConversionControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: string;

  constructor(props: TConversionControllerEvent) {
    super(props);
  }
}

export interface ConversionEventEmitterControllerInterface {
  /**
   * Emit conversion event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitConversionEvent: (
    eventName: ConversionEventType,
    event: ConversionControllerEvent,
  ) => void;
}

export class ConversionEventEmitterController
  implements ConversionEventEmitter
{
  constructor(
    private eventEmitter: ConversionEventEmitterControllerInterface,
  ) {}

  /**
   * Emit ready event.
   * @param event Data.
   */
  readyConversion(event: ConversionEvent): void {
    const controllerEvent = new ConversionControllerEvent({
      id: event.id,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitConversionEvent(
      ConversionEventType.READY,
      controllerEvent,
    );
  }
}
