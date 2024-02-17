import { Logger } from 'winston';
import { Controller, Get } from '@nestjs/common';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  KafkaServiceParam,
  LoggerParam,
  TranslateService,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { KeyState, KeyType } from '@zro/pix-keys/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  GetAllPixKeyRequest,
  GetAllPixKeyResponseItem,
} from '@zro/pix-keys/interface';
import { pixKeyTypeRest, pixKeyStateRest } from '@zro/api-users/infrastructure';
import { GetAllPixKeyServiceKafka } from '@zro/pix-keys/infrastructure';

type GetAllPixKeyRestResponseItem = GetAllPixKeyResponseItem & {
  stateDescription: string;
};

class GetAllPixKeyRestResponse {
  @ApiProperty({
    description: 'Pix Key ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Pix key.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  key!: string;

  @ApiProperty(pixKeyTypeRest)
  type!: KeyType;

  @ApiProperty(pixKeyStateRest)
  state!: KeyState;

  @ApiProperty({
    description: 'Pix key state translated.',
    example: 'Pronta para uso',
  })
  state_description!: string;

  @ApiProperty({
    description: 'Pix Key created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: GetAllPixKeyRestResponseItem) {
    this.id = props.id;
    this.key = props.key;
    this.type = props.type;
    this.state = props.state;
    this.state_description = props.stateDescription;
    this.created_at = props.createdAt;
  }
}

/**
 * User pix keys controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Keys')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('pix/keys')
@HasPermission('api-users-get-pix-keys')
export class GetAllPixKeyRestController {
  /**
   * Default constructor.
   * @param translateService GetAll microservice.
   */
  constructor(private readonly translateService: TranslateService) {}

  /**
   * get pixKey endpoint.
   */
  @ApiOperation({
    deprecated: true,
    summary: "List the user's keys.",
    description:
      'List all keys associated with the user account except canceled keys. Return a list of keys.',
  })
  @ApiOkResponse({
    description: 'The pix keys returned successfully.',
    type: [GetAllPixKeyRestResponse],
  })
  @ApiUnauthorizedResponse({
    description: 'User authentication failed.',
  })
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @KafkaServiceParam(GetAllPixKeyServiceKafka)
    service: GetAllPixKeyServiceKafka,
    @LoggerParam(GetAllPixKeyRestController)
    logger: Logger,
  ): Promise<GetAllPixKeyRestResponse[]> {
    // Create a payload.
    const payload: GetAllPixKeyRequest = {
      userId: user.uuid,
    };

    logger.debug('Getting list pixKeys.', { user, payload });

    // Call get all pixKey service.
    const result = await service.execute(payload);

    logger.debug('PixKeys listed.', { result });

    const response = await Promise.all(
      result.data.map(async (item) => {
        return new GetAllPixKeyRestResponse({
          ...item,
          stateDescription: await this.translateService.translate(
            'pix_key_state',
            item.state,
          ),
        });
      }),
    );

    return response;
  }
}
