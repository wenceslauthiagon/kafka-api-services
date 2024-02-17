import { Logger } from 'winston';
import { City, CityRepository } from '@zro/banking/domain';
import { CityEventEmitter } from '@zro/banking/application';

export class SyncCityUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param cityRepository City repository.
   */
  constructor(
    private logger: Logger,
    private readonly cityRepository: CityRepository,
    private readonly eventEmitter: CityEventEmitter,
  ) {
    this.logger = logger.child({ context: SyncCityUseCase.name });
  }

  /**
   * Sync cities.
   */
  async execute(downloadedCity: City[]): Promise<void> {
    // Data input check
    if (!downloadedCity?.length) {
      this.logger.info('No downloaded city list found.', {
        downloadedCity: downloadedCity?.length,
      });
      return;
    }

    // Search for cities
    const foundCities = await this.cityRepository.getAll();

    this.logger.debug('Found cities.', { cities: foundCities.length });

    // Get the city's code list
    const foundCityCode = foundCities.map((item) => item.code);
    const downloadedCityCode = downloadedCity.map((item) => item.code);

    // Parse new, update and delete city lists.
    const newCities = downloadedCity.filter(
      (city) => !foundCityCode.includes(city.code),
    );
    const deleteCities = foundCities.filter(
      (city) => !downloadedCityCode.includes(city.code),
    );
    const updateCities = foundCities.filter((city) =>
      downloadedCityCode.includes(city.code),
    );

    this.logger.info('Filtered city lists length.', {
      newCities: newCities.length,
      deleteCities: deleteCities.length,
      updateCities: updateCities.length,
    });

    // Save all repository promises
    const promiseData: Promise<City | number>[] = [];

    // Create new cities?
    if (newCities.length) {
      newCities.forEach((city) => {
        promiseData.push(this.cityRepository.create(city));
        this.eventEmitter.createdCity(city);
      });
      this.logger.debug('City list created.');
    }

    // Delete evicted cities?
    if (deleteCities.length) {
      deleteCities.forEach((city) => {
        promiseData.push(this.cityRepository.delete(city));
        this.eventEmitter.deletedCity(city);
      });
      this.logger.debug('City list deleted.');
    }

    // Update cities?
    if (updateCities.length) {
      updateCities.forEach((city) => {
        const newInfoCity = downloadedCity.find(
          (item) => item.code === city.code,
        );

        // Check if the city info has the same new info
        if (city.name === newInfoCity.name) return;

        city.name = newInfoCity.name;
        city.federativeUnitCode = newInfoCity.federativeUnitCode;
        city.federativeUnitName = newInfoCity.federativeUnitName;
        city.federativeUnitAcronym = newInfoCity.federativeUnitAcronym;
        city.regionCode = newInfoCity.regionCode;
        city.regionName = newInfoCity.regionName;
        city.regionAcronym = newInfoCity.regionAcronym;

        promiseData.push(this.cityRepository.update(city));
        this.eventEmitter.updatedCity(city);
      });

      this.logger.debug('City list updated.');
    }

    if (promiseData.length) {
      await Promise.all(promiseData);
    }

    this.logger.debug('City sync list completed.');
  }
}
