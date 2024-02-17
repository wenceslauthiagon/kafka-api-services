import { Logger } from 'winston';
import { Body, Controller, Patch } from '@nestjs/common';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsString,
  IsUUID,
} from 'class-validator';
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
  UpdateUserWalletByWalletServiceKafka,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import {
  UpdateUserWalletByWalletResponse,
  UpdateUserWalletByWalletRequest,
} from '@zro/operations/interface';

class UpdateUserWalletByWalletBody {
  @ApiProperty({
    description: 'User ID.',
  })
  @IsUUID(4)
  user_id!: string;

  @ApiProperty({
    description:
      'Wallet permission type that defines what the user can do. <b>No possible to set ROOT permission.</b>',
    example: ['CLIENT'],
  })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(16)
  @ArrayMinSize(1)
  @IsString({ each: true })
  permission_types!: string[];
}

class UpdateUserWalletByWalletRestResponse {
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

  constructor(props: UpdateUserWalletByWalletResponse) {
    this.id = props.id;
    this.name = props.name;
    this.permission_types = props.permissionTypeTags;
  }
}

/**
 * Wallet controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Permissions')
@Controller('operations/permissions')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@HasPermission(
  'api-users-patch-operations-permissions-by-wallet-id-and-user-id',
)
export class UpdateUserWalletByWalletRestController {
  /**
   * update wallet permissions endpoint.
   */
  @ApiOperation({
    summary: "Update user's wallet permissions.",
    description:
      "Update user's wallet permissions. Only the root user can update another user's permission.",
  })
  @ApiOkResponse({
    description: 'Wallet permissions updated.',
    type: UpdateUserWalletByWalletRestResponse,
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
  @Patch()
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Body() body: UpdateUserWalletByWalletBody,
    @KafkaServiceParam(UpdateUserWalletByWalletServiceKafka)
    service: UpdateUserWalletByWalletServiceKafka,
    @LoggerParam(UpdateUserWalletByWalletRestController)
    logger: Logger,
  ): Promise<UpdateUserWalletByWalletRestResponse> {
    // Update payload.
    const payload: UpdateUserWalletByWalletRequest = {
      ownerWalletId: user.uuid,
      walletId: wallet.id,
      userId: body.user_id,
      permissionTypeTags: body.permission_types,
    };

    logger.debug('Update wallet permissions by wallet.', { user, payload });

    // Call update wallet permissions by wallet service.
    const result = await service.execute(payload);

    logger.debug('Wallet permissions updated.', { result });

    const response = new UpdateUserWalletByWalletRestResponse(result);

    return response;
  }
}
