import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { NotImplementedException } from '../exceptions/not_implemented.exception';
import { DatabaseRepository } from '../modules/sequelize.module';
import { ProtocolType } from '../helpers/protocol.helper';

function getTransaction(context: ExecutionContext): Transaction {
  const protocol = context.getType();
  if (protocol === ProtocolType.HTTP) {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    return request.transaction;
  } else if (protocol === ProtocolType.RPC) {
    const ctx = context.switchToRpc();
    const request = ctx.getContext();
    return request.transaction;
  } else {
    throw new NotImplementedException(
      `Protocol ${protocol} is not implemented.`,
    );
  }
}

/**
 * Database transaction decorator.
 */
export const TransactionParam = createParamDecorator(
  (data: any, context: ExecutionContext): Transaction => {
    return getTransaction(context);
  },
);

export const RepositoryParam = createParamDecorator(
  (Repository: any, context: ExecutionContext): DatabaseRepository => {
    const transaction = getTransaction(context);
    return new Repository(transaction);
  },
);
