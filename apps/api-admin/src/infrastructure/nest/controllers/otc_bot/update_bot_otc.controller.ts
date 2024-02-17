import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsUUID,
  Min,
} from 'class-validator';
import { Logger } from 'winston';
import { Body, Controller, Param, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import { BotOtcControl } from '@zro/otc-bot/domain';
import { UpdateBotOtcServiceKafka } from '@zro/otc-bot/infrastructure';
import { UpdateBotOtcRequest } from '@zro/otc-bot/interface';

class UpdateBotOtcParams {
  @ApiProperty({
    description: 'BotOtc ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

class UpdateBotOtcBody {
  @ApiPropertyOptional({
    description: 'Bot Otc spread.',
    example: 100,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  spread?: number;

  @ApiPropertyOptional({
    description: 'Bot Otc step.',
    example: 10000,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  step?: number;

  @ApiPropertyOptional({
    description: 'Bot Otc balance.',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  balance?: number;

  @ApiPropertyOptional({
    description: 'Bot Otc control.',
    examples: ['START', 'STOP'],
    enum: BotOtcControl,
  })
  @IsOptional()
  @IsEnum(BotOtcControl)
  @IsIn([BotOtcControl.START, BotOtcControl.STOP])
  control?: BotOtcControl;
}

export class UpdateBotOtcRestResponse {
  @ApiProperty({
    description: 'BotOtc ID.',
    example: '295564a9-c5fd-4e73-9abb-72e0383f2dfb',
  })
  id: string;

  @ApiProperty({
    description: 'BotOtc spread.',
    example: 100,
  })
  spread: number;

  @ApiProperty({
    description: 'BotOtc name.',
    example: 'BOT_ARBITRAGE_TEST',
  })
  name: string;

  @ApiProperty({
    description: 'BotOtc step.',
    example: 10000,
  })
  step: number;

  @ApiProperty({
    description: 'BotOtc balance.',
    example: 0,
  })
  balance: number;

  @ApiProperty({
    description: 'BotOtc control.',
    enum: BotOtcControl,
    example: BotOtcControl.START,
  })
  control: BotOtcControl;

  constructor(props: UpdateBotOtcRestResponse) {
    this.id = props.id;
    this.name = props.name;
    this.spread = props.spread;
    this.step = props.step;
    this.balance = props.balance;
    this.control = props.control;
  }
}

/**
 * BotOtc update controller.
 */
@ApiTags('Otc Bot')
@ApiBearerAuth()
@Controller('otc-bot/:id')
export class UpdateBotOtcRestController {
  /**
   * Update botOtc endpoint.
   */

  @ApiOperation({
    summary: 'Update Bot OTC.',
    description: 'Updates an existent Bot OTC.',
  })
  @ApiOkResponse({
    description: 'BotOtc updated successfully.',
    type: UpdateBotOtcRestResponse,
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Patch()
  async execute(
    @KafkaServiceParam(UpdateBotOtcServiceKafka)
    updateService: UpdateBotOtcServiceKafka,
    @LoggerParam(UpdateBotOtcRestController)
    logger: Logger,
    @Param() params: UpdateBotOtcParams,
    @Body() body: UpdateBotOtcBody,
  ): Promise<UpdateBotOtcRestResponse> {
    const payload: UpdateBotOtcRequest = {
      id: params.id,
      balance: body.balance,
      control: body.control,
      spread: body.spread,
      step: body.step,
    };

    logger.debug('Update botOtc.', { payload });

    // Call update botOtc service.
    const result = await updateService.execute(payload);

    logger.debug('botOtc updated.', { result });

    const response = new UpdateBotOtcRestResponse(result);

    return response;
  }
}
