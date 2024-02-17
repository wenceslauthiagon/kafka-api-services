import { IsString, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { CityEvent, CityEventEmitter } from '@zro/banking/application';

export enum CityEventType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
}

type TCityControllerEvent = Pick<CityEvent, 'id' | 'code'>;

export class CityControllerEvent
  extends AutoValidator
  implements TCityControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsString()
  code: string;

  constructor(props: TCityControllerEvent) {
    super(props);
  }
}

export interface CityEventEmitterControllerInterface {
  /**
   * Call cities microservice to emit city.
   * @param eventName The event name.
   * @param event Data.
   */
  emitCityEvent: (eventName: CityEventType, event: CityControllerEvent) => void;
}

export class CityEventEmitterController implements CityEventEmitter {
  constructor(private eventEmitter: CityEventEmitterControllerInterface) {}

  /**
   * Call cities microservice to emit city.
   * @param city Data.
   */
  createdCity(city: CityEvent): void {
    const event = new CityControllerEvent({
      id: city.id,
      code: city.code,
    });

    this.eventEmitter.emitCityEvent(CityEventType.CREATED, event);
  }

  /**
   * Call cities microservice to emit city.
   * @param city Data.
   */
  updatedCity(city: CityEvent): void {
    const event = new CityControllerEvent({
      id: city.id,
      code: city.code,
    });

    this.eventEmitter.emitCityEvent(CityEventType.UPDATED, event);
  }

  /**
   * Call cities microservice to emit city.
   * @param city Data.
   */
  deletedCity(city: CityEvent): void {
    const event = new CityControllerEvent({
      id: city.id,
      code: city.code,
    });

    this.eventEmitter.emitCityEvent(CityEventType.DELETED, event);
  }
}
