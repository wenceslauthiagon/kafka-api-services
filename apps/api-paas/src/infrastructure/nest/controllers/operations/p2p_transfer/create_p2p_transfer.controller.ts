import { Logger } from 'winston';
import { Controller, Body, Post } from '@nestjs/common';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsPositive,
  MaxLength,
  IsUUID,
} from 'class-validator';
import {
  DefaultApiHeaders,
  EnableReplayProtection,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
  RequestTransactionId,
  SanitizeHtml,
  TransactionApiHeader,
} from '@zro/common';
import { AuthWallet } from '@zro/operations/domain';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  CreateP2PTransferRequest,
  CreateP2PTransferResponse,
} from '@zro/operations/interface';
import {
  AuthWalletParam,
  CreateP2PTransferServiceKafka,
  WalletApiHeader,
} from '@zro/operations/infrastructure';

class CreateP2PTransferBody {
  @ApiProperty({
    description: 'Destination wallet UUID.',
    required: false,
  })
  @IsUUID(4)
  destination_wallet_id!: string;

  @ApiProperty({
    description: 'Transfer currency amount symbol.',
    example: 'BRL',
  })
  @IsString()
  amount_currency!: string;

  @ApiProperty({
    description: 'Transfer amount in cents.',
    example: 1299,
  })
  @IsInt()
  @IsPositive()
  amount!: number;

  @ApiProperty({
    description: 'Transfer fee in cents.',
    example: 19,
  })
  @IsOptional()
  @IsInt()
  fee?: number;

  @ApiPropertyOptional({
    description: 'Transfer description.',
    example: 'User defined description',
    required: false,
  })
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  description?: string;
}

class CreateP2PTransferRestResponse {
  @ApiProperty({
    description: 'Transfer UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Transfer Operation UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  operation_id!: string;

  @ApiProperty({
    description: 'Transfer currency amount.',
    example: 'BRL',
  })
  amount_currency!: string;

  @ApiProperty({
    description: 'Transfer amount in cents.',
    example: 1299,
  })
  amount!: number;

  @ApiProperty({
    description: 'Transfer fee in cents.',
    example: 10,
  })
  fee: number;

  @ApiPropertyOptional({
    description: 'Transfer description.',
    required: false,
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'Transfer created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: CreateP2PTransferResponse) {
    this.id = props.id;
    this.operation_id = props.operationId;
    this.amount_currency = props.amountCurrencySymbol;
    this.amount = props.amount;
    this.fee = props.fee;
    this.description = props.description;
    this.created_at = props.createdAt;
  }
}

/**
 * User operations controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | P2P Transfers')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@TransactionApiHeader()
@EnableReplayProtection()
@Controller('operations/p2p-transfers')
@HasPermission('api-paas-post-operations-p2p-transfers')
export class CreateP2PTransferRestController {
  /**
   * Send transfer endpoint.
   */
  @ApiOperation({
    summary: 'Create new P2P transfer.',
    description:
      'Transfer funds from one wallet to another within your organization (Master Account and Sub-account wallets are permitted). Insert the UUID of the wallet you want to send from under the header section (x-wallet-uuid). If you leave the x-wallet-uuid param empty, your default wallet will be settled. Enter the destination wallet and all transaction information on the request body below. Execute to conclude the transaction.',
  })
  @ApiCreatedResponse({
    description: 'Transfer response.',
    type: CreateP2PTransferRestResponse,
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
  @Post()
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Body() body: CreateP2PTransferBody,
    @KafkaServiceParam(CreateP2PTransferServiceKafka)
    service: CreateP2PTransferServiceKafka,
    @LoggerParam(CreateP2PTransferRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
  ): Promise<CreateP2PTransferRestResponse> {
    // Send a payload.
    const payload: CreateP2PTransferRequest = {
      id: transactionId,
      userId: user.uuid,
      walletId: wallet.id,
      beneficiaryWalletId: body.destination_wallet_id,
      amount: body.amount,
      fee: body.fee,
      amountCurrencySymbol: body.amount_currency,
      description: body.description,
    };

    logger.debug('Send transfer.', { user, payload });

    // Call send transfer service.
    const result = await service.execute(payload);

    logger.debug('Transfer sent.', { result });

    const response = new CreateP2PTransferRestResponse(result);

    return response;
  }
}
