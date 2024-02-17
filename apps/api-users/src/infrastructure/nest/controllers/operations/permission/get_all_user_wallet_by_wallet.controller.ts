import { Logger } from 'winston';
import { Controller, Get } from '@nestjs/common';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  DefaultApiHeaders,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet } from '@zro/operations/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  AuthWalletParam,
  GetAllUserWalletByUserAndWalletServiceKafka,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import {
  GetAllUserWalletByUserAndWalletResponse,
  GetAllUserWalletByUserAndWalletRequest,
  GetAllUserWalletByUserAndWalletResponseItem,
} from '@zro/operations/interface';

class GetWalletPermissionByIdRestResponseItem {
  @ApiProperty({
    description: 'User id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'User name.',
    example: 'James bond',
  })
  name: string;

  @ApiProperty({
    description: 'Wallet permission type that defines what the user can do.',
    example: ['CLIENT'],
  })
  permission_types: string[];

  constructor(props: GetAllUserWalletByUserAndWalletResponseItem) {
    this.id = props.id;
    this.name = props.name;
    this.permission_types = props.permissionTypeTags;
  }
}

class GetAllUserWalletByWalletRestResponse {
  @ApiProperty({
    description: 'Total of permissions.',
    example: 1,
  })
  total!: number;

  @ApiProperty({
    description: 'Users of wallet.',
    type: [GetWalletPermissionByIdRestResponseItem],
  })
  data!: GetWalletPermissionByIdRestResponseItem[];

  constructor(props: GetAllUserWalletByUserAndWalletResponse) {
    this.total = props.total;
    this.data = props.data.map(
      (user) => new GetWalletPermissionByIdRestResponseItem(user),
    );
  }
}

/**
 * Wallet controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Permissions')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@Controller('operations/permissions/users')
@HasPermission('api-users-get-operations-permissions-by-wallet-id')
export class GetAllUserWalletByWalletRestController {
  /**
   * get wallet permissions endpoint.
   */
  @ApiOperation({
    summary: "Get user's wallet permissions.",
    description: "Get user's wallet permissions.",
  })
  @ApiOkResponse({
    description: 'Wallet permissions found.',
    type: GetAllUserWalletByWalletRestResponse,
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
    @AuthWalletParam() wallet: AuthWallet,
    @KafkaServiceParam(GetAllUserWalletByUserAndWalletServiceKafka)
    service: GetAllUserWalletByUserAndWalletServiceKafka,
    @LoggerParam(GetAllUserWalletByWalletRestController)
    logger: Logger,
  ): Promise<GetAllUserWalletByWalletRestResponse> {
    // GetById a payload.
    const payload: GetAllUserWalletByUserAndWalletRequest = {
      walletId: wallet.id,
      userId: user.uuid,
    };

    logger.debug('Get wallet permissions by wallet.', { user, payload });

    // Call get wallet permissions by wallet service.
    const result = await service.execute(payload);

    logger.debug('Wallet permissions found.', { result });

    const response = new GetAllUserWalletByWalletRestResponse(result);

    return response;
  }
}
