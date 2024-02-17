import {
  Controller,
  Param,
  Get,
  Res,
  HttpStatus,
  Version,
} from '@nestjs/common';
import { Logger } from 'winston';
import { IsUUID } from 'class-validator';
import {
  ApiProperty,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { File, KafkaServiceParam, LoggerParam, getMoment } from '@zro/common';
import { QrCodeDynamicNotFoundException } from '@zro/pix-payments/application';
import { GetQrCodeDynamicByIdServiceKafka } from '@zro/pix-payments/infrastructure';
import { GetQrCodeDynamicByIdRequest } from '@zro/pix-payments/interface';
import {
  BcbError,
  bcbGoneError,
  bcbNotFoundError,
  bcbServiceUnavailableError,
  headerApplicationJose,
} from '@zro/api-open-banking/infrastructure';

class GetQrCodeDynamicByIdParams {
  @ApiProperty({
    description: 'QR Code ID.',
  })
  @IsUUID(4)
  id!: string;
}

/**
 * Api Open Banking Pix QR Code controller.
 */
@ApiTags('Pix | QR Code')
@Controller('pix/qr/:id')
export class GetQrCodeDynamicByIdRestController {
  /**
   * get qr code dynamic by id endpoint.
   */
  @ApiOperation({
    summary: 'Get QR Code Dynamic by ID.',
    description:
      'Enter the QR code dynamic ID below and execute to get its JWS Payload.',
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
    @Param() params: GetQrCodeDynamicByIdParams,
    @KafkaServiceParam(GetQrCodeDynamicByIdServiceKafka)
    service: GetQrCodeDynamicByIdServiceKafka,
    @LoggerParam(GetQrCodeDynamicByIdRestController)
    logger: Logger,
  ): Promise<string | BcbError> {
    // Create a payload.
    const payload: GetQrCodeDynamicByIdRequest = {
      id: params.id,
    };

    logger.debug('Get dynamic qr code by id request.', { payload });

    try {
      // Call get qr code dynamic service.
      const result = await service.execute(payload);

      logger.debug('Get dynamic qr code by id result.', { result });

      if (!result?.payloadJws) {
        throw new QrCodeDynamicNotFoundException({ id: params.id });
      }

      if (
        result.expirationDate &&
        getMoment().isSameOrAfter(getMoment(result.expirationDate))
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
      } else if (error instanceof QrCodeDynamicNotFoundException) {
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
