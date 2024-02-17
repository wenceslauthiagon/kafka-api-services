import { Logger, createLogger, transports } from 'winston';
import * as Transport from 'winston-transport';

class NullTransport extends Transport {
  constructor(opts?: any) {
    super(opts);
  }

  log(info: any, callback: any) {
    callback();
  }
}

const isSilent =
  process.argv.includes('--silent') ||
  process.env.APP_LOG_LEVEL?.toLowerCase() === 'off';

export const defaultLogger: Logger = createLogger({
  transports: [!isSilent ? new transports.Console() : new NullTransport()],
});
