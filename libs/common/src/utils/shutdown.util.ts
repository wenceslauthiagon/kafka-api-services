import { Logger } from 'winston';
import { INestApplicationContext } from '@nestjs/common';
import { LOGGER_SERVICE } from '../modules';

export async function shutdown(app?: INestApplicationContext, error?: Error) {
  const logger = app?.get<Logger>(LOGGER_SERVICE) ?? console;

  logger.info('Shutting down Nest app...');

  error &&
    logger.error(`Uncaught exception error: ${error.message}\n${error.stack}`);

  logger.info('Goodbye cruel world!');

  await app?.flushLogs();
  await app?.close();
}
