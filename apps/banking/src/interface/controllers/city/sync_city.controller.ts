import { Logger } from 'winston';
import { IsBoolean, IsString, IsUUID, MaxLength } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { City, CityEntity, CityRepository } from '@zro/banking/domain';
import { SyncCityUseCase as UseCase } from '@zro/banking/application';
import {
  CityEventEmitterController,
  CityEventEmitterControllerInterface,
} from '@zro/banking/interface';

type TSyncCityRequest = Pick<
  City,
  | 'id'
  | 'code'
  | 'name'
  | 'federativeUnitCode'
  | 'federativeUnitName'
  | 'federativeUnitAcronym'
  | 'regionCode'
  | 'regionName'
  | 'regionAcronym'
  | 'active'
>;

export class SyncCityRequest extends AutoValidator implements TSyncCityRequest {
  @IsUUID(4)
  id: string;

  @IsString()
  @MaxLength(255)
  code: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(255)
  federativeUnitCode: string;

  @IsString()
  @MaxLength(255)
  federativeUnitName: string;

  @IsString()
  @MaxLength(255)
  federativeUnitAcronym: string;

  @IsString()
  @MaxLength(255)
  regionCode: string;

  @IsString()
  @MaxLength(255)
  regionName: string;

  @IsString()
  @MaxLength(255)
  regionAcronym: string;

  @IsBoolean()
  active: boolean;

  constructor(props: TSyncCityRequest) {
    super(props);
  }
}

export class SyncCityController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    cityRepository: CityRepository,
    serviceEventEmitter: CityEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({ context: SyncCityController.name });

    const eventEmitter = new CityEventEmitterController(serviceEventEmitter);
    this.usecase = new UseCase(this.logger, cityRepository, eventEmitter);
  }

  async execute(request: SyncCityRequest[]): Promise<void> {
    this.logger.debug('Sync cities request.', { request: request.length });

    const body = request.map((item) => new CityEntity(item));

    return this.usecase.execute(body);
  }
}
