import { City } from '@zro/banking/domain';

export interface CityRepository {
  /**
   * Insert a city.
   * @param {City} city City to save.
   * @returns {City} Created city.
   */
  create: (city: City) => Promise<City>;

  /**
   * Update a city.
   * @param {City} city City to update.
   * @returns {City} Updated city.
   */
  update: (city: City) => Promise<City>;

  /**
   * Delete a city.
   * @param {string} city City to delete.
   * @returns {number} The number of deleted cities;
   */
  delete: (city: City) => Promise<number>;

  /**
   * List all cities.
   * @return {City[]} Cities found.
   */
  getAll: () => Promise<City[]>;

  /**
   * Gets a city by name and federal unit.
   * @param {string} name City's name.
   * @param {string} federativeUnitAcronym City's federativeUnitAcronym.
   * @return {City} City found.
   */
  getByNameAndfederativeUnitAcronym: (
    name: string,
    federativeUnitAcronym: string,
  ) => Promise<City>;

  /**
   * Get city by id.
   * @param id The city id.
   * @returns The city found.
   */
  getById: (id: string) => Promise<City>;

  /**
   * Gets a city by code.
   * @param {string} code City's code.
   * @returns {City} The City associated to the code;
   */
  getByCode: (code: string) => Promise<City>;
}
