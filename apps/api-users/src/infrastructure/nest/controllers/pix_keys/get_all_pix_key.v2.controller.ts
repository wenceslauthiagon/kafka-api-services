import { Logger } from 'winston';
import { Controller, Get, Query, Version } from '@nestjs/common';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import {
  KafkaServiceParam,
  LoggerParam,
  TranslateService,
  DefaultApiHeaders,
  HasPermission,
  Sort,
  PaginationSort,
  PaginationParams,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { KeyState, KeyType } from '@zro/pix-keys/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  GetAllPixKeyByUserRequestSort,
  GetAllPixKeyByUserRequest,
  GetAllPixKeyByUserResponseItem,
} from '@zro/pix-keys/interface';
import { pixKeyTypeRest, pixKeyStateRest } from '@zro/api-users/infrastructure';
import { GetAllPixKeyByUserServiceKafka } from '@zro/pix-keys/infrastructure';

class V2GetAllWalletAccountParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllPixKeyByUserRequestSort,
  })
  @IsOptional()
  @Sort(GetAllPixKeyByUserRequestSort)
  sort?: PaginationSort;
}

type TV2GetAllPixKeyByUserRestResponseItem = GetAllPixKeyByUserResponseItem & {
  stateDescription: string;
};

class V2GetAllPixKeyByUserRestResponseItem {
  @ApiProperty({
    description: 'Pix Key ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'Pix key.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  key: string;

  @ApiProperty(pixKeyTypeRest)
  type: KeyType;

  @ApiProperty(pixKeyStateRest)
  state: KeyState;

  @ApiProperty({
    description: 'Pix key state translated.',
    example: 'Pronta para uso',
  })
  state_description: string;

  @ApiProperty({
    description: 'Pix Key created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: TV2GetAllPixKeyByUserRestResponseItem) {
    this.id = props.id;
    this.key = props.key;
    this.type = props.type;
    this.state = props.state;
    this.state_description = props.stateDescription;
    this.created_at = props.createdAt;
  }
}

type TV2GetAllPixKeyByUserRestResponse = {
  data: V2GetAllPixKeyByUserRestResponseItem[];
  total: number;
  maxTotal: number;
};

class V2GetAllPixKeyByUserRestResponse {
  @ApiProperty({
    description: 'Pix Keys data.',
    example: [],
    type: [V2GetAllPixKeyByUserRestResponseItem],
  })
  data: V2GetAllPixKeyByUserRestResponseItem[];

  @ApiProperty({
    description: 'Total Pix Keys.',
    example: 1,
  })
  total: number;

  @ApiProperty({
    description: 'Allowed total maximum of Pix Keys.',
    example: 5,
  })
  max_total: number;

  constructor(props: TV2GetAllPixKeyByUserRestResponse) {
    this.data = props.data;
    this.total = props.total;
    this.max_total = props.maxTotal;
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
export class V2GetAllPixKeyByUserRestController {
  /**
   * Default constructor.
   * @param translateService GetAll microservice.
   */
  constructor(private readonly translateService: TranslateService) {}

  /**
   * get pixKey endpoint.
   */
  @ApiOperation({
    summary: "List the user's keys.",
    description:
      'List all keys associated with the user account except canceled keys. Return a list of keys.',
  })
  @ApiOkResponse({
    description: 'The pix keys returned successfully.',
    type: V2GetAllPixKeyByUserRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'User authentication failed.',
  })
  @Version('2')
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @KafkaServiceParam(GetAllPixKeyByUserServiceKafka)
    service: GetAllPixKeyByUserServiceKafka,
    @Query() query: V2GetAllWalletAccountParams,
    @LoggerParam(V2GetAllPixKeyByUserRestController)
    logger: Logger,
  ): Promise<V2GetAllPixKeyByUserRestResponse> {
    // Create a payload.
    const payload: GetAllPixKeyByUserRequest = {
      userId: user.uuid,
      personType: user.type,
      sort: query.sort,
      page: query.page,
      pageSize: query.size,
      order: query.order,
    };

    logger.debug('Getting list pixKeys.', { user, payload });

    // Call get all pixKey service.
    const result = await service.execute(payload);

    logger.debug('PixKeys listed.', { result });

    const pixKeysRestReponse = await Promise.all(
      result.data.map(async (item) => {
        return new V2GetAllPixKeyByUserRestResponseItem({
          ...item,
          stateDescription: await this.translateService.translate(
            'pix_key_state',
            item.state,
          ),
        });
      }),
    );

    const response = new V2GetAllPixKeyByUserRestResponse({
      data: pixKeysRestReponse,
      total: result.total,
      maxTotal: result.maxTotal,
    });

    return response;
  }
}
