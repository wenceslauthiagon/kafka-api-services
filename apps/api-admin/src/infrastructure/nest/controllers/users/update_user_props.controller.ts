import { Body, Controller, Param, Patch } from '@nestjs/common';
import { Logger } from 'winston';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength } from 'class-validator';
import { InjectLogger, RequestId } from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import {
  UpdateUserPropsRequest,
  UpdateUserPropsResponse,
} from '@zro/users/interface';
import {
  AuthAdminParam,
  UpdateUserPropsServiceKafka,
} from '@zro/api-admin/infrastructure';

export class UpdateUserPropsParams {
  @ApiProperty({
    description: 'User UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

export class UpdateUserPropsBody {
  @ApiProperty({
    type: String,
    description: 'Prop key.',
    example: 'newProp',
  })
  @IsString()
  @MaxLength(255)
  propKey!: string;

  @ApiProperty({
    type: String,
    description: 'Prop value.',
    example: 'example value',
  })
  @IsString()
  @MaxLength(255)
  propValue!: string;
}

export class UpdateUserPropsRestResponse {
  @ApiProperty({
    type: 'UUID',
    description: 'Updated user UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  userUuid!: string;

  @ApiProperty({
    type: String,
    description: 'Updated prop key.',
    example: 'newProp',
  })
  @IsString()
  @MaxLength(255)
  propKey!: string;

  @ApiProperty({
    type: String,
    description: 'Updated prop value.',
    example: 'example value',
  })
  @IsString()
  @MaxLength(255)
  propValue!: string;

  constructor(props: UpdateUserPropsResponse) {
    this.userUuid = props.uuid;
    this.propKey = props.propKey;
    this.propValue = props.propValue;
  }
}

/**
 * Update user props controller. Controller is protected by admin JWT access token.
 */
@ApiTags('User')
@ApiBearerAuth()
@Controller('user/:id/props')
export class UpdateUserPropsRestController {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param updateUserPropsService Update user props microservice.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly updateUserPropsService: UpdateUserPropsServiceKafka,
  ) {
    this.logger = logger.child({ context: UpdateUserPropsRestController.name });
  }

  /**
   * Update user props endpoint.
   */
  @ApiOperation({
    description: 'Update user props field.',
  })
  @ApiCreatedResponse({
    description: 'User props has been successfully updated.',
    type: UpdateUserPropsRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Admin authentication failed.',
  })
  @Patch()
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @RequestId() requestId: string,
    @Body() body: UpdateUserPropsBody,
    @Param() params: UpdateUserPropsParams,
  ): Promise<UpdateUserPropsRestResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    const { id } = params;
    const { propKey, propValue } = body;

    // Create a payload.
    const payload: UpdateUserPropsRequest = {
      uuid: id,
      propKey,
      propValue,
    };

    logger.debug('Updating user props.', { admin, payload });

    // Call update user props service.
    const result = await this.updateUserPropsService.execute(
      requestId,
      payload,
    );

    logger.debug('Updated user props.', { result });

    const response = result && new UpdateUserPropsRestResponse(result);

    return response;
  }
}
