import { Logger } from 'winston';
import { IsEnum, IsOptional } from 'class-validator';
import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  DefaultApiHeaders,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { WalletState } from '@zro/operations/domain';
import { OwnerType } from '@zro/operations/application';
import {
  GetAllUserWalletByUserResponse,
  GetAllUserWalletByUserRequest,
} from '@zro/operations/interface';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetAllUserWalletByUserServiceKafka } from '@zro/operations/infrastructure';

class GetAllWalletByUserRestQuery {
  @ApiPropertyOptional({
    description: 'User wallet owner type.',
    enum: OwnerType,
  })
  @IsOptional()
  @IsEnum(OwnerType)
  owner?: OwnerType;
}

class GetAllWalletByUserRestResponse {
  @ApiProperty({
    description: 'Wallet id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'Wallet name.',
    example: 'BTC',
  })
  name: string;

  @ApiProperty({
    description: 'Wallet default flag.',
    example: false,
  })
  default: boolean;

  @ApiProperty({
    description: 'Wallet state.',
    enum: WalletState,
    example: WalletState.ACTIVE,
  })
  state: WalletState;

  @ApiProperty({
    description: 'Wallet permission type that defines what the user can do.',
    example: ['CLIENT'],
  })
  permission_types: string[];

  @ApiProperty({
    description: 'Wallet owner id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  owner_id: string;

  @ApiProperty({
    description: 'Wallet owner name.',
    example: 'James Bond',
  })
  owner_name: string;

  @ApiProperty({
    description: 'Wallet created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetAllUserWalletByUserResponse) {
    this.id = props.wallet.uuid;
    this.name = props.wallet.name;
    this.default = props.wallet.default;
    this.state = props.wallet.state;
    this.permission_types = props.permissionTypeTags;
    this.owner_id = props.wallet.userId;
    this.owner_name = props.wallet.userName;
    this.created_at = props.wallet.createdAt;
  }
}

/**
 * Wallet controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Wallets')
@Controller('operations/wallets')
@ApiBearerAuth()
@DefaultApiHeaders()
@HasPermission('api-users-get-operations-wallets')
export class GetAllWalletRestController {
  /**
   * get wallet endpoint.
   */
  @ApiOperation({
    summary: "List user's wallets.",
    description: "Get a list of user's wallets.",
  })
  @ApiOkResponse({
    description: 'The wallets returned successfully.',
    type: [GetAllWalletByUserRestResponse],
  })
  @ApiUnauthorizedResponse({
    description: 'User authentication failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @Query() query: GetAllWalletByUserRestQuery,
    @KafkaServiceParam(GetAllUserWalletByUserServiceKafka)
    GetAllWalletByUserService: GetAllUserWalletByUserServiceKafka,
    @LoggerParam(GetAllWalletRestController)
    logger: Logger,
  ): Promise<GetAllWalletByUserRestResponse[]> {
    // GetAll payload.
    const payload: GetAllUserWalletByUserRequest = {
      userId: user.uuid,
      owner: query.owner,
    };

    logger.debug('GetAll wallets.', { user, payload });

    // Call get all wallets service.
    const result = await GetAllWalletByUserService.execute(payload);

    logger.debug('Wallets found.', { result });

    const response = result.map(
      (item) => new GetAllWalletByUserRestResponse(item),
    );

    return response;
  }
}
