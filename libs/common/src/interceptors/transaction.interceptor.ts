import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Logger } from 'winston';
import { Observable, catchError, tap } from 'rxjs';
import { Transaction, Sequelize } from 'sequelize';
import { ProtocolType } from '../helpers/protocol.helper';
import { InjectLogger, InjectSequelize } from '../modules';
import { NotImplementedException } from '../exceptions/not_implemented.exception';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(
    @InjectSequelize() private readonly sequelize: Sequelize,
    @InjectLogger() private readonly logger: Logger,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    let request: any = null;
    const protocol = context.getType();
    if (protocol === ProtocolType.HTTP) {
      const ctx = context.switchToHttp();
      request = ctx.getRequest();
    } else if (protocol === ProtocolType.RPC) {
      const ctx = context.switchToRpc();
      request = ctx.getContext();
    } else {
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }

    const logger: Logger = (request.logger ?? this.logger).child({
      context: TransactionInterceptor.name,
    });

    const transaction: Transaction = await this.sequelize.transaction();

    logger.debug('Transaction created.');

    request.transaction = transaction;

    return next.handle().pipe(
      tap(async () => {
        await transaction.commit();
        logger.debug('Transaction committed.');
      }),
      catchError(async (err) => {
        await transaction.rollback();
        logger.debug('Transaction rolled back.');
        throw err;
      }),
    );
  }
}
