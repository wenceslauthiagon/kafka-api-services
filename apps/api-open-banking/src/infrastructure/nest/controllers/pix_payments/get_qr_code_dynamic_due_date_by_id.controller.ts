import { v4 as uuidV4 } from 'uuid';
import {
  Controller,
  Param,
  Get,
  Res,
  HttpStatus,
  Query,
  Version,
} from '@nestjs/common';
import { Logger } from 'winston';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import {
  ApiProperty,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsIsoStringDateFormat,
  File,
  KafkaServiceParam,
  LoggerParam,
  getMoment,
} from '@zro/common';
import { QrCodeDynamicDueDateNotFoundException } from '@zro/pix-payments/application';
import { GetQrCodeDynamicDueDateByIdServiceKafka } from '@zro/pix-payments/infrastructure';
import { GetQrCodeDynamicDueDateByIdRequest } from '@zro/pix-payments/interface';
import {
  BcbError,
  bcbGoneError,
  bcbNotFoundError,
  bcbServiceUnavailableError,
  headerApplicationJose,
} from '@zro/api-open-banking/infrastructure';

class GetQrCodeDynamicDueDateByIdParams {
  @ApiProperty({
    description: 'QR Code Dynamic Due Date ID.',
    example: uuidV4(),
  })
  @IsUUID(4)
  id!: string;
}

class GetQrCodeDynamicDueDateByIdQuery {
  @ApiPropertyOptional({
    description: 'Intended payment date.',
    example: getMoment().format('YYYY-MM-DD'),
  })
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format DPP',
  })
  @IsOptional()
  DPP?: Date;

  @ApiPropertyOptional({
    description: 'City code.',
    example: '2611606',
  })
  @IsOptional()
  @IsString()
  codMun?: string;
}

/**
 * Api Open Banking Pix QR Code controller.
 */
@ApiTags('Pix | QR Code')
@Controller('pix/qr/cobv/:id')
export class GetQrCodeDynamicDueDateByIdRestController {
  /**
   * Get qr code dynamic due date by id endpoint.
   */
  @ApiOperation({
    summary: 'Get QR Code Dynamic Due Date by ID.',
    description:
      'Enter the QR code dynamic due date ID below and execute to get its JWS Payload.',
  })
  @ApiOkResponse({
    description:
      'The Pix dynamic QR code JWS Payload was returned successfully.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Version('1')
  @Get()
  @File()
  async execute(
    @Res({ passthrough: true }) res,
    @Param() params: GetQrCodeDynamicDueDateByIdParams,
    @Query() query: GetQrCodeDynamicDueDateByIdQuery,
    @KafkaServiceParam(GetQrCodeDynamicDueDateByIdServiceKafka)
    service: GetQrCodeDynamicDueDateByIdServiceKafka,
    @LoggerParam(GetQrCodeDynamicDueDateByIdRestController)
    logger: Logger,
  ): Promise<string | BcbError> {
    // Create a payload.
    const payload: GetQrCodeDynamicDueDateByIdRequest = {
      id: params.id,
      ...(query.DPP && { paymentDate: query.DPP }),
      ...(query.codMun && { cityCode: query.codMun }),
    };

    logger.debug('Get QR code dynamic due date by id request.', { payload });

    try {
      // Call get qr code dynamic due date service.
      const result = await service.execute(payload);

      logger.debug('Get QR code dynamic due date by id result.', { result });

      if (!result?.payloadJws) {
        throw new QrCodeDynamicDueDateNotFoundException({
          id: params.id,
        });
      }

      const paymentDate = getMoment(payload.paymentDate) ?? getMoment();

      if (
        result.expirationDate &&
        paymentDate.isSameOrAfter(getMoment(result.expirationDate))
      ) {
        throw HttpStatus.GONE;
      }

      res.set(headerApplicationJose);

      return result.payloadJws;
    } catch (error) {
      let errorContent: BcbError = null;

      // Transform error into BACEN pattern.
      if (error === HttpStatus.GONE) {
        errorContent = bcbGoneError;

        // Set the HTTP status code to Gone.
        res.status(HttpStatus.GONE);
      } else if (error instanceof QrCodeDynamicDueDateNotFoundException) {
        errorContent = bcbNotFoundError;

        // Set the HTTP status code to Not found.
        res.status(HttpStatus.NOT_FOUND);
      } else {
        errorContent = bcbServiceUnavailableError;
        // Set the HTTP status code to Service unavailable.
        res.status(HttpStatus.SERVICE_UNAVAILABLE);
      }

      // Send the JSON content as the response.
      return errorContent;
    }
  }
}
