import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { Logger } from 'winston';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { IsBoolean, IsUUID } from 'class-validator';
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { UpdateBankServiceKafka } from '@zro/banking/infrastructure';
import { UpdateBankRequest, UpdateBankResponse } from '@zro/banking/interface';

export class UpdateBankParams {
  @ApiProperty({
    description: 'Bank ID.',
  })
  @IsUUID(4)
  id!: string;
}

export class UpdateBankBody {
  @ApiProperty({
    description: 'Bank active.',
    example: false,
  })
  @IsBoolean()
  active!: boolean;
}

export class UpdateBankRestResponse {
  @ApiProperty({
    description: 'Bank ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Bank ispb.',
    example: '7219',
  })
  ispb!: string;

  @ApiProperty({
    description: 'Bank name.',
    example: 'Bank Name S.A.',
  })
  name!: string;

  @ApiProperty({
    description: 'Bank full name.',
    example: 'Bank Name of Money.',
  })
  full_name!: string;

  @ApiProperty({
    description: 'Bank active flag.',
    example: true,
  })
  active!: boolean;

  @ApiProperty({
    description: 'Bank created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: UpdateBankResponse) {
    this.id = props.id;
    this.ispb = props.ispb;
    this.name = props.name;
    this.full_name = props.fullName;
    this.active = props.active;
    this.created_at = props.createdAt;
  }
}

/**
 * Update bank controller. Controller is protected by admin JWT access token.
 */
@ApiTags('Banking')
@ApiBearerAuth()
@Controller('banking/banks/:id')
export class UpdateBankRestController {
  /**
   * Update bank endpoint.
   */
  @ApiOperation({
    description: 'Update bank.',
  })
  @ApiOkResponse({
    description: 'Bank has been successfully updated.',
    type: UpdateBankRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Admin authentication failed.',
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
  @HttpCode(HttpStatus.OK)
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @KafkaServiceParam(UpdateBankServiceKafka)
    updateBankService: UpdateBankServiceKafka,
    @LoggerParam(UpdateBankRestController)
    logger: Logger,
    @Body() body: UpdateBankBody,
    @Param() params: UpdateBankParams,
  ): Promise<UpdateBankRestResponse> {
    // Create a payload.
    const payload: UpdateBankRequest = {
      id: params.id,
      active: body.active,
    };

    logger.debug('Updating bank.', { admin, payload });

    // Call update bank service.
    const result = await updateBankService.execute(payload);

    logger.debug('Updated bank.', { result });

    const response = new UpdateBankRestResponse(result);

    return response;
  }
}
