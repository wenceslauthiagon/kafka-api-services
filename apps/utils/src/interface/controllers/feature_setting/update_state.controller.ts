import { Logger } from 'winston';
import { IsUUID, IsEnum } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  FeatureSetting,
  FeatureSettingName,
  FeatureSettingRepository,
  FeatureSettingState,
} from '@zro/utils/domain';
import { UpdateFeatureSettingStateUseCase } from '@zro/utils/application';
import {
  FeatureSettingEventEmitterController,
  FeatureSettingEventEmitterControllerInterface,
} from '@zro/utils/interface';

type TUpdateFeatureSettingStateRequest = Pick<FeatureSetting, 'id' | 'state'>;

export class UpdateFeatureSettingStateRequest
  extends AutoValidator
  implements TUpdateFeatureSettingStateRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(FeatureSettingState)
  state: FeatureSettingState;

  constructor(props: TUpdateFeatureSettingStateRequest) {
    super(props);
  }
}

type TUpdateFeatureSettingStateResponse = Pick<
  FeatureSetting,
  'id' | 'name' | 'state' | 'updatedAt'
>;

export class UpdateFeatureSettingStateResponse
  extends AutoValidator
  implements TUpdateFeatureSettingStateResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(FeatureSettingName)
  name: FeatureSettingName;

  @IsEnum(FeatureSettingState)
  state: FeatureSettingState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format updatedAt',
  })
  updatedAt: Date;

  constructor(props: TUpdateFeatureSettingStateResponse) {
    super(props);
  }
}

export class UpdateFeatureSettingStateController {
  private usecase: UpdateFeatureSettingStateUseCase;

  constructor(
    private logger: Logger,
    featureSettingRepository: FeatureSettingRepository,
    eventEmitter: FeatureSettingEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: UpdateFeatureSettingStateController.name,
    });

    const controllerFeatureSettingEventEmitter =
      new FeatureSettingEventEmitterController(eventEmitter);

    this.usecase = new UpdateFeatureSettingStateUseCase(
      this.logger,
      featureSettingRepository,
      controllerFeatureSettingEventEmitter,
    );
  }

  async execute(
    request: UpdateFeatureSettingStateRequest,
  ): Promise<UpdateFeatureSettingStateResponse> {
    this.logger.debug('Update feature setting state.', { request });

    const { id, state } = request;

    const result = await this.usecase.execute(id, state);

    if (!result) return null;

    const response = new UpdateFeatureSettingStateResponse({
      id: result.id,
      name: result.name,
      state: result.state,
      updatedAt: result.updatedAt,
    });

    this.logger.debug('Update feature setting response.', {
      response,
    });

    return response;
  }
}
