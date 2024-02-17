import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  CacheTTL,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  MissingEnvVarException,
  RepositoryParam,
} from '@zro/common';
import { PermissionActionRepository } from '@zro/operations/domain';
import {
  KAFKA_TOPICS,
  PermissionActionDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  GetAllPermissionActionByPermissionTypesController,
  GetAllPermissionActionByPermissionTypesRequest,
  GetAllPermissionActionByPermissionTypesResponse,
} from '@zro/operations/interface';

export type GetAllPermissionActionByPermissionTypesKafkaRequest =
  KafkaMessage<GetAllPermissionActionByPermissionTypesRequest>;

export type GetAllPermissionActionByPermissionTypesKafkaResponse =
  KafkaResponse<GetAllPermissionActionByPermissionTypesResponse>;

interface PermissionTypeRootConfig {
  APP_OPERATION_PERMISSION_TYPE_ROOT_TAG: string;
}

@Controller()
@CacheTTL(3600) // 1h
@MicroserviceController()
export class GetAllPermissionActionByPermissionTypesMicroserviceController {
  private readonly permissionTypeRootTag: string;

  /**
   * Default operations RPC controller constructor.
   */
  constructor(private configService: ConfigService<PermissionTypeRootConfig>) {
    this.permissionTypeRootTag = this.configService.get<string>(
      'APP_OPERATION_PERMISSION_TYPE_ROOT_TAG',
    );

    if (!this.permissionTypeRootTag) {
      throw new MissingEnvVarException([
        'APP_OPERATION_PERMISSION_TYPE_ROOT_TAG',
      ]);
    }
  }

  /**
   * Parse Get all PermissionAction by permissionType message and call
   * Get all PermissionAction by permissionType controller.
   */
  @KafkaMessagePattern(
    KAFKA_TOPICS.PERMISSION_ACTION.GET_ALL_BY_PERMISSION_TYPES,
  )
  async execute(
    @RepositoryParam(PermissionActionDatabaseRepository)
    permissionActionRepository: PermissionActionRepository,
    @LoggerParam(GetAllPermissionActionByPermissionTypesMicroserviceController)
    logger: Logger,
    @Payload('value')
    message: GetAllPermissionActionByPermissionTypesRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllPermissionActionByPermissionTypesKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllPermissionActionByPermissionTypesRequest(message);

    logger.debug('Get all PermissionAction by permissionType.', { payload });

    // Create controller.
    const controller = new GetAllPermissionActionByPermissionTypesController(
      logger,
      permissionActionRepository,
      this.permissionTypeRootTag,
    );

    // Get all PermissionAction by permissionType.
    const permissionActions = await controller.execute(payload);

    logger.debug('Get all PermissionAction by permissionTypes found.', {
      permissionActions: permissionActions.total,
    });

    return {
      ctx,
      value: permissionActions,
    };
  }
}
