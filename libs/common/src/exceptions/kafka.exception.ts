import { ExceptionTypes } from '../helpers/error.constants';
import { DefaultException, Exception } from '../helpers/error.helper';

@Exception(ExceptionTypes.SYSTEM, 'KAFKA')
export class KafkaException extends DefaultException {
  constructor(error: Error) {
    super({
      message: 'Kafka error',
      type: ExceptionTypes.SYSTEM,
      code: 'KAFKA',
      data: error,
    });
  }
}

@Exception(ExceptionTypes.SYSTEM, 'NOT_LOADED_KAFKA_SERVICE')
export class NotLoadedKafkaServiceException extends DefaultException {
  constructor(serviceName: string) {
    super({
      message:
        'The client consumer did not subscribe to the corresponding reply topic. Please load kafka service with KafkaModule.forFeature().',
      type: ExceptionTypes.SYSTEM,
      code: 'NOT_LOADED_KAFKA_SERVICE',
      data: serviceName,
    });
  }
}
