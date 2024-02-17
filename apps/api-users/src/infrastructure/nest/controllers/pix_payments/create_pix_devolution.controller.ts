import { Controller, Body, Post, UseGuards } from '@nestjs/common';
import { Logger } from 'winston';
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
  IsUUID,
  IsString,
  IsOptional,
  Length,
  IsPositive,
  MaxLength,
  IsInt,
} from 'class-validator';
import {
  EnableReplayProtection,
  KafkaServiceParam,
  LoggerParam,
  SanitizeHtml,
  DefaultApiHeaders,
  HasPermission,
  RequestTransactionId,
  TransactionApiHeader,
} from '@zro/common';
import { PixDevolutionState } from '@zro/pix-payments/domain';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet } from '@zro/operations/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { CreatePixDevolutionServiceKafka } from '@zro/pix-payments/infrastructure';
import {
  CreatePixDevolutionRequest,
  CreatePixDevolutionResponse,
} from '@zro/pix-payments/interface';
import { PinGuard } from '@zro/api-users/infrastructure';

class CreatePixDevolutionBody {
  @ApiProperty({
    description:
      'Credit statement ID. Statement to be charged back. Now it is operation_id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  operation_id: string;

  @ApiProperty({
    description:
      'Value in R$ cents. Should be less or equal then credit transacation.',
    example: 2300,
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: "User's 4-digit pin.",
    example: '1234',
    minLength: 4,
    maxLength: 4,
  })
  @Length(4, 4)
  @IsString()
  pin: string;

  @ApiPropertyOptional({
    description: 'User defined payment description.',
    example: 'User defined description',
  })
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  description?: string;
}

class CreatePixDevolutionRestResponse {
  @ApiProperty({
    description: 'Devolution ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'Value in R$ cents.',
    example: 1299,
  })
  amount: number;

  @ApiPropertyOptional({
    description: 'User defined devolution description.',
    example: 'User defined description',
  })
  description?: string;

  @ApiProperty({
    enum: PixDevolutionState,
    description: 'Devolution state.',
    example: PixDevolutionState.PENDING,
  })
  state: PixDevolutionState;

  @ApiProperty({
    description: 'Devolution created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: CreatePixDevolutionResponse) {
    this.id = props.id;
    this.amount = props.amount;
    this.description = props.description;
    this.state = props.state;
    this.created_at = props.createdAt;
  }
}

/**
 * User pix devolutions controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Devolutions')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@UseGuards(PinGuard)
@TransactionApiHeader()
@EnableReplayProtection()
@Controller('pix/devolutions')
@HasPermission('api-users-post-pix-devolutions')
export class CreatePixDevolutionRestController {
  /**
   * create devolution endpoint.
   */
  @ApiOperation({
    summary: 'Create new pix devolution.',
    description:
      "Enter the pix devolution's information on the requisition body below and execute to create a new pix devolution.",
  })
  @ApiCreatedResponse({
    description: 'The devolution returned successfully.',
    type: CreatePixDevolutionRestResponse,
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
    @KafkaServiceParam(CreatePixDevolutionServiceKafka)
    createService: CreatePixDevolutionServiceKafka,
    @LoggerParam(CreatePixDevolutionRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
    @Body() body: CreatePixDevolutionBody,
  ): Promise<CreatePixDevolutionRestResponse> {
    // Create a payload.
    const payload: CreatePixDevolutionRequest = {
      id: transactionId,
      userId: user.uuid,
      walletId: wallet.id,
      amount: body.amount,
      operationId: body.operation_id,
      description: body.description,
    };

    logger.debug('Create devolution.', { user, payload });

    // Call create devolution service.
    const result = await createService.execute(payload);

    logger.debug('Devolution created.', result);

    const response = new CreatePixDevolutionRestResponse(result);

    return response;
  }
}
