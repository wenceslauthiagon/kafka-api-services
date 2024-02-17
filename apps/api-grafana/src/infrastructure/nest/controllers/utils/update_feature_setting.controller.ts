import { Body, Controller, Param, Post } from '@nestjs/common';
import { Logger } from 'winston';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import {
  UpdateFeatureSettingStateRequest,
  UpdateFeatureSettingStateResponse,
} from '@zro/utils/interface';
import { FeatureSettingName, FeatureSettingState } from '@zro/utils/domain';
import { UpdateFeatureSettingStateServiceKafka } from '@zro/utils/infrastructure';

class UpdateFeatureSettingStateParams {
  @ApiProperty({
    description: 'Feature Setting UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

class UpdateFeatureSettingStateBody {
  @ApiProperty({
    description: 'Feature Setting State.',
    example: FeatureSettingState.ACTIVE,
    enum: FeatureSettingState,
  })
  @IsEnum(FeatureSettingState)
  state: FeatureSettingState;
}

class UpdateFeatureSettingStateRestResponse {
  @ApiProperty({
    description: 'Feature Setting UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Feature Setting Name.',
    example: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
    enum: FeatureSettingName,
  })
  name: FeatureSettingName;

  @ApiProperty({
    description: 'Feature Setting State.',
    example: FeatureSettingState.ACTIVE,
    enum: FeatureSettingState,
  })
  state: FeatureSettingState;

  @ApiProperty({
    description: 'Feature Setting updated at.',
    example: new Date(),
  })
  updated_at!: Date;

  constructor(props: UpdateFeatureSettingStateResponse) {
    this.id = props.id;
    this.name = props.name;
    this.state = props.state;
    this.updated_at = props.updatedAt;
  }
}

/**
 * Update state controller.
 */
@ApiBearerAuth()
@ApiTags('Util')
@Controller('feature-settings/:id')
export class UpdateFeatureSettingStateRestController {
  /**
   * Update feature settings endpoint.
   */
  @ApiOperation({
    description:
      'This update will active ou deactive any feature for the system. Example: CREATE_EXCHANGE_QUOTATION',
  })
  @ApiCreatedResponse({
    description: 'Feature setting has been successfully updated.',
    type: UpdateFeatureSettingStateRestResponse,
  })
  @Post()
  async execute(
    @Body() body: UpdateFeatureSettingStateBody,
    @Param() params: UpdateFeatureSettingStateParams,
    @KafkaServiceParam(UpdateFeatureSettingStateServiceKafka)
    service: UpdateFeatureSettingStateServiceKafka,
    @LoggerParam(UpdateFeatureSettingStateRestController)
    logger: Logger,
  ): Promise<UpdateFeatureSettingStateRestResponse> {
    const { id } = params;
    const { state } = body;

    // Create a payload.
    const payload: UpdateFeatureSettingStateRequest = {
      id,
      state,
    };

    logger.debug('Updating feature settings.', { payload });

    // Call update feature settings service.
    const result = await service.execute(payload);

    logger.debug('Updated feature settings.', { result });

    const response = new UpdateFeatureSettingStateRestResponse(result);

    return response;
  }
}
