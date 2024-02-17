import stringify from 'safe-stable-stringify';
import { transports, format, Logger } from 'winston';
import { Inject, LogLevel, Module, ConsoleLogger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  WinstonLogger,
  WinstonModule,
  WINSTON_MODULE_PROVIDER,
} from 'nest-winston';

const { Console } = transports;
const { combine, timestamp, json } = format;

export const LOGGER_SERVICE = 'LOGGER_SERVICE';
export const LOGGER_SERVICE_PROVIDER = 'LOGGER_SERVICE_PROVIDER';

export const InjectLogger = () => Inject(LOGGER_SERVICE);

interface FormatJsonOptions {
  /**
   * The number of white space used to format the json.
   * @default 0
   */
  space: number;

  /**
   * Maximum number of object nesting levels (at least 1) that will be serialized.
   * Objects at the maximum level are serialized as `"[Object]"` and arrays as `"[Array]"`.
   * @default Infinity
   */
  maximumDepth: number;
}

const JSON_OPTIONS: FormatJsonOptions = {
  space: 0,
  maximumDepth: 10,
};

stringify.configure({
  maximumDepth: JSON_OPTIONS.maximumDepth,
});

interface LoggerConfig {
  APP_LOG_LEVEL: string;
  APP_LOG_SPACE: string;
  APP_LOG_DEPTH: string;
}

const getWinstonOptions = (configService: ConfigService<LoggerConfig>) => {
  JSON_OPTIONS.space = Number(
    configService.get<string>('APP_LOG_SPACE') ?? JSON_OPTIONS.space,
  );
  JSON_OPTIONS.maximumDepth = Number(
    configService.get<string>('APP_LOG_DEPTH') ?? JSON_OPTIONS.maximumDepth,
  );

  const level = configService.get<string>('APP_LOG_LEVEL', 'error');
  const silent =
    process.argv.indexOf('--silent') >= 0 || level?.toLowerCase() === 'off';

  const console = new Console({ level, silent });

  return {
    transports: [console],
    format: combine(timestamp(), json(JSON_OPTIONS)),
  };
};

const getLoggerInstance = (logger: Logger): Logger =>
  // Overrides the logger 'child' function to use the root's 'write' function.
  // DO NOT CHANGE THIS because the original function throws a stack overflow exception.
  Object.create(logger, {
    child: {
      value: function child(defaultRequestMetadata: any): Logger {
        // PS: every logger child has a logger root.
        const root = this.root ?? this;
        // Save previous metadata along with new metadata.
        const metadata = { ...this.metadata, ...defaultRequestMetadata };
        // Return a new logger instance with new 'write' function.
        return Object.create(this, {
          metadata: {
            value: metadata,
          },
          root: {
            value: root,
          },
          write: {
            value: function (info: any) {
              const infoClone = { ...metadata, ...info };
              if (info instanceof Error) {
                infoClone.stack = info.stack;
                infoClone.message = info.message;
              }
              root.write(infoClone);
            },
          },
        });
      },
    },
  });

@Module({
  imports: [
    ConfigModule,
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getWinstonOptions,
    }),
  ],
  exports: [LOGGER_SERVICE, LOGGER_SERVICE_PROVIDER],
  providers: [
    {
      provide: LOGGER_SERVICE,
      inject: [WINSTON_MODULE_PROVIDER],
      useFactory: getLoggerInstance,
    },
    {
      provide: LOGGER_SERVICE_PROVIDER,
      inject: [LOGGER_SERVICE],
      useFactory: (logger) => {
        return new WinstonLogger(logger);
      },
    },
  ],
})
export class LoggerModule {}

export class ConsoleLoggerModule extends ConsoleLogger {
  protected printMessages(
    messages: string[],
    context = 'Nest',
    level: LogLevel = 'log',
    writeStreamType?: 'stdout' | 'stderr',
  ) {
    messages.forEach((message) => {
      const jsonMessage = {
        level,
        timestamp: new Date(),
        pid: process.pid,
        message,
        context,
      };

      const formatedMessage = `${stringify(
        jsonMessage,
        null,
        JSON_OPTIONS.space,
      )}\n`;

      process[
        writeStreamType !== null && writeStreamType !== void 0
          ? writeStreamType
          : 'stdout'
      ].write(formatedMessage);
    });
  }
}
