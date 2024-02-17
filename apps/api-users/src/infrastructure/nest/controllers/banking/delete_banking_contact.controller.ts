import { Logger } from 'winston';
import { Transform } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';
import { Controller, Delete, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiProperty,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { DeleteBankingAccountContactRequest } from '@zro/banking/interface';
import { AuthUserParam } from '@zro/users/infrastructure';
import { DeleteBankingAccountContactServiceKafka } from '@zro/banking/infrastructure';

class DeleteBankingAccountContactParams {
  @ApiProperty({
    description: 'Banking Account Contact ID.',
    type: 'number',
  })
  @IsInt()
  @IsPositive()
  @Transform((params) => params && parseInt(params.value))
  id: number;
}

/**
 * BankingAccountContacts controller. Controller is protected by JWT access token.
 */
@ApiTags('Banking')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('/banking/contacts')
@HasPermission('api-users-delete-banking-account-contact')
export class DeleteBankingAccountContactRestController {
  /**
   * delete banking account contact endpoint.
   */
  @ApiOperation({
    summary: 'Delete the banking account contact.',
    description: 'Delete banking account contact by ID.',
  })
  @ApiOkResponse({
    description: 'The banking account contact deleted successfully.',
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
  @Delete()
  async execute(
    @AuthUserParam() user: AuthUser,
    @KafkaServiceParam(DeleteBankingAccountContactServiceKafka)
    service: DeleteBankingAccountContactServiceKafka,
    @LoggerParam(DeleteBankingAccountContactRestController)
    logger: Logger,
    @Query() params: DeleteBankingAccountContactParams,
  ): Promise<void> {
    // Delete a payload.
    const payload: DeleteBankingAccountContactRequest = {
      userId: user.id,
      id: params.id,
    };

    logger.debug('Delete banking contacts.', { user, payload });

    // Call delete banking account contact service.
    await service.execute(payload);

    logger.debug('BankingAccountContacts deleted.');
  }
}
