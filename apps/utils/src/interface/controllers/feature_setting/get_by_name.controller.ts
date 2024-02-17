import { Logger } from 'winston';
import { IsUUID, IsEnum } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  FeatureSetting,
  FeatureSettingName,
  FeatureSettingRepository,
  FeatureSettingState,
} from '@zro/utils/domain';
import { GetFeatureSettingByNameUseCase } from '@zro/utils/application';

type TGetFeatureSettingByNameRequest = Pick<FeatureSetting, 'name'>;

export class GetFeatureSettingByNameRequest
  extends AutoValidator
  implements TGetFeatureSettingByNameRequest
{
  @IsEnum(FeatureSettingName)
  name: FeatureSettingName;

  constructor(props: TGetFeatureSettingByNameRequest) {
    super(props);
  }
}

type TGetFeatureSettingByNameResponse = Pick<
  FeatureSetting,
  'id' | 'name' | 'state' | 'createdAt'
>;

export class GetFeatureSettingByNameResponse
  extends AutoValidator
  implements TGetFeatureSettingByNameResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(FeatureSettingName)
  name: FeatureSettingName;

  @IsEnum(FeatureSettingState)
  state: FeatureSettingState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetFeatureSettingByNameResponse) {
    super(props);
  }
}

export class GetFeatureSettingByNameController {
  private usecase: GetFeatureSettingByNameUseCase;

  constructor(
    private logger: Logger,
    featureSettingRepository: FeatureSettingRepository,
  ) {
    this.logger = logger.child({
      context: GetFeatureSettingByNameController.name,
    });

    this.usecase = new GetFeatureSettingByNameUseCase(
      this.logger,
      featureSettingRepository,
    );
  }

  async execute(
    request: GetFeatureSettingByNameRequest,
  ): Promise<GetFeatureSettingByNameResponse> {
    this.logger.debug('Get feature setting by name.', { request });

    const { name } = request;

    const result = await this.usecase.execute(name);

    if (!result) return null;

    const response = new GetFeatureSettingByNameResponse({
      id: result.id,
      name: result.name,
      state: result.state,
      createdAt: result.createdAt,
    });

    this.logger.debug('Get feature setting response.', {
      response,
    });

    return response;
  }
}
