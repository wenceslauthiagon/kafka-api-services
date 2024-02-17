import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { IS_FILE_RESPONSE } from '../decorators/file.decorator';

/**
 * Response format.
 */
export interface Response<T> {
  success: boolean;
  data: T;
  error: any;
}

/**
 * Intercepts reponse and change it to response format.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  /**
   * Default interceptor constructor.
   * @param reflector Access to class or method modifiers.
   */
  constructor(private reflector: Reflector) {}

  /**
   * Intercept response and map data to response format.
   * @param context Request context.
   * @param next Next handle function.
   * @returns Modified response data.
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    // Check if requested controller or handler is file.
    // Controller or handler decorated with @File will modify the response
    const isFile = this.reflector.getAllAndOverride<boolean>(IS_FILE_RESPONSE, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Is controller or handler file?
    if (isFile) {
      // Yes! The handler will be default for return stream.
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        error: null,
      })),
    );
  }
}
