import { City } from '@zro/banking/domain';

export type CityEvent = Pick<City, 'id' | 'code'>;

export interface CityEventEmitter {
  /**
   * Call Cities microservice to emit City.
   * @param city Data.
   */
  createdCity: (city: City) => void;

  /**
   * Call Cities microservice to emit City.
   * @param city Data.
   */
  updatedCity: (city: City) => void;

  /**
   * Call Cities microservice to emit City.
   * @param city Data.
   */
  deletedCity: (city: City) => void;
}
