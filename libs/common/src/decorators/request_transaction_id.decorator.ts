import { v4 as uuidV4 } from 'uuid';
import {
  createParamDecorator,
  ExecutionContext,
  applyDecorators,
} from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { ProtocolType } from '../helpers/protocol.helper';
import { NotImplementedException } from '../exceptions/not_implemented.exception';

export function TransactionApiHeader() {
  return applyDecorators(
    ApiHeader({
      name: 'x-transaction-uuid',
      description:
        'The transaction ID is a UUID (v4) used to uniquely identify the object that will be created. All objects must have an identifier.',
      required: true,
    }),
  );
}

/**
 * Get request transaction id.
 */
export const RequestTransactionId = createParamDecorator(
  (data: any, context: ExecutionContext): string => {
    const protocol = context.getType();
    if (protocol !== ProtocolType.HTTP) {
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }

    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    return (
      // FIXME: Remove 'transaction_uuid' value when headers x-transaction-uuid is required.
      request.headers?.['transaction_uuid'] ??
      request.headers?.['x-transaction-uuid'] ??
      // FIXME: Remove uuidV4() default value when headers x-transaction-uuid is required.
      uuidV4()
    );
  },
);
