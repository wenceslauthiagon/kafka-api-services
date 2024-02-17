import { applyDecorators, UseFilters, UseInterceptors } from '@nestjs/common';
import { DefaultExceptionFilter } from '../filters';
import {
  RequestIdInterceptor,
  InstrumentationInterceptor,
  LoggerInterceptor,
  KafkaServiceInterceptor,
  KafkaEventInterceptor,
  TransactionInterceptor,
  ExceptionInterceptor,
  CacheInterceptor,
} from '../interceptors';

export function MicroserviceController(interceptors: any[] = []) {
  return applyDecorators(
    UseFilters(DefaultExceptionFilter),
    UseInterceptors(
      RequestIdInterceptor,
      InstrumentationInterceptor,
      LoggerInterceptor,
      CacheInterceptor,
      TransactionInterceptor,
      KafkaServiceInterceptor,
      KafkaEventInterceptor,
      ExceptionInterceptor,
      ...interceptors,
    ),
  );
}

export const ObserverController = MicroserviceController;
