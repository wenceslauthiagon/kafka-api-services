import { Logger } from 'winston';
import { IsUUID } from 'class-validator';
import { Controller, Body, Post } from '@nestjs/common';
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
import { InjectLogger, RequestId } from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import {
  MountExchangeContractRequest,
  MountExchangeContractResponse,
} from '@zro/otc/interface';
import {
  AuthAdminParam,
  MountExchangeContractServiceKafka,
} from '@zro/api-admin/infrastructure';

export class CreateExchangeContractBodyParams {
  @ApiProperty({
    description: 'A list of remittances ids to mount the exchange.',
  })
  @IsUUID(4, { each: true })
  remittances_ids: string[];
}

class CreateExchangeContractRestResponse {
  @ApiProperty({
    description: 'Exchange Contract ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Exchange Contract contract number.',
  })
  contract_number!: string;

  @ApiProperty({
    description: 'Exchange Contract vet quote.',
    example: 15.7,
  })
  vet_quote!: number;

  @ApiProperty({
    description: 'Exchange Contract contract quote.',
    example: 5.68,
  })
  contract_quote!: number;

  @ApiProperty({
    description: 'Exchange Contract total amount.',
    example: 54000,
  })
  total_amount!: number;

  @ApiProperty({
    description: 'Exchange Contract created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: MountExchangeContractResponse) {
    this.id = props.id;
    this.contract_number = props.contractNumber;
    this.vet_quote = props.vetQuote;
    this.contract_quote = props.contractQuote;
    this.total_amount = props.totalAmount;
    this.created_at = props.createdAt;
  }
}

/**
 * Exchange Contract controller. Controller is protected by JWT access token.
 */
@ApiTags('Exchange Contract')
@ApiBearerAuth()
@Controller('otc/exchange-contracts')
export class CreateExchangeContractRestController {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param mountExchangeContractService mount exchange contract microservice.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly mountExchangeContractService: MountExchangeContractServiceKafka,
  ) {
    this.logger = logger.child({
      context: CreateExchangeContractRestController.name,
    });
  }

  /**
   * Create exchange contract endpoint.
   */
  @ApiOperation({
    summary: 'Create the exchange contract.',
    description: 'Create the exchange contract.',
  })
  @ApiOkResponse({
    description: 'The exchange contract created successfully.',
    type: CreateExchangeContractRestResponse,
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
    @AuthAdminParam() admin: AuthAdmin,
    @RequestId() requestId: string,
    @Body() body: CreateExchangeContractBodyParams,
  ): Promise<CreateExchangeContractRestResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    const { remittances_ids } = body;

    // GetAll a payload.
    const payload: MountExchangeContractRequest = {
      remittancesIds: remittances_ids,
    };

    logger.debug('Create Exchange Contracts', { admin, remittances_ids });

    // Call mount exchange contract service.
    const result = await this.mountExchangeContractService.execute(
      requestId,
      payload,
    );

    logger.debug('Exchange Contract Created.', { result });

    const response = new CreateExchangeContractRestResponse(result);

    return response;
  }
}
