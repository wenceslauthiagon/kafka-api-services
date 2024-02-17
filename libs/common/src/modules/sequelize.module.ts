import { Logger } from 'winston';
import { DynamicModule, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Transaction, ValidationError } from 'sequelize';
import {
  Model,
  ModelCtor,
  Sequelize,
  SequelizeOptions,
  ValidationFailed,
} from 'sequelize-typescript';
import { DatabaseException, UnknownException } from '../exceptions';
import { LoggerModule } from './logger.module';
import {
  DATABASE_MODEL_PROVIDER,
  DATABASE_PROVIDER,
} from './sequelize.constants';

export const InjectSequelize = () => Inject(DATABASE_PROVIDER);

export interface DatabaseConfig {
  APP_ENV: string;
  APP_NAME: string;
  APP_DATABASE_HOST: string;
  APP_DATABASE_WRITE_HOST: string;
  APP_DATABASE_READ_HOST: string;
  APP_DATABASE_PORT: number;
  APP_DATABASE_SCHEMA: string;
  APP_DATABASE_DATABASE: string;
  APP_DATABASE_USERNAME: string;
  APP_DATABASE_PASSWORD: string;
  APP_DATABASE_SSL: boolean;
  APP_DATABASE_LOG: boolean;
  APP_DATABASE_POOL_MAX: string;
  APP_DATABASE_POOL_ACQUIRE: string;
  APP_DATABASE_POOL_IDLE: string;
}

/**
 * Default sequelize model.
 */
export abstract class DatabaseModel<
  TModelAttributes = any,
  TCreationAttributes = TModelAttributes,
> extends Model<TModelAttributes, TCreationAttributes> {
  /**
   * Process model validation failure.
   *
   * @param instance Model instance.
   * @param options Query options.
   * @param error Error catched.
   */
  @ValidationFailed
  static validationFailedHook(instance, options, error) {
    if (error instanceof ValidationError) {
      throw new DatabaseException(error);
    }
    throw new UnknownException(error);
  }
}

/**
 * Database repository base class.
 */
export abstract class DatabaseRepository {
  /**
   * Create a repository instance with given database transaction. Subclasses
   * can use this transaction in its queries.
   *
   * @param _transaction Sequelize transaction.
   */
  constructor(private _transaction?: Transaction) {}

  /**
   * Get associated database transaction
   * @returns Sequelize transaction.
   */
  get transaction(): Transaction {
    return this._transaction;
  }
}

export class DatabaseModule {
  static models: ModelCtor[] = [];
  static sequelize: Sequelize;

  /**
   * Add modules to sequelize instance. If there is no sequelize instance, so
   * a new one will be built.
   * @param models List of models to be added to sequelize instance.
   * @returns Database module.
   */
  static forFeature(models: ModelCtor[] = []): DynamicModule {
    // Remember models to be loaded when sequelize provider bootstrap.
    this.models.push(...models);

    // Remove duplicate modules.
    this.models = [...new Set(this.models)];

    return {
      module: DatabaseModule,
      imports: [ConfigModule, LoggerModule],
      exports: [DATABASE_PROVIDER],
      providers: [
        {
          /**
           * Provides a sequelize instance.
           */
          provide: DATABASE_PROVIDER,
          inject: [ConfigService],

          /**
           * Createa a unique sequelize instance.
           * @param configService Environment variables.
           * @param logger Default logger.
           * @returns Sequelize instance.
           */
          useFactory: async (
            configService: ConfigService<DatabaseConfig>,
            logger: Logger,
          ) => {
            if (!DatabaseModule.sequelize) {
              const showLog = JSON.parse(
                configService.get<string>('APP_DATABASE_LOG', 'false'),
              );

              logger = logger && logger.child({ context: 'SequelizeModule' });

              const appName = configService.get<string>('APP_NAME', 'no_name');

              const host = configService.get<string>('APP_DATABASE_HOST');
              const writeHost = configService.get<string>(
                'APP_DATABASE_WRITE_HOST',
              );
              const readHost = configService.get<string>(
                'APP_DATABASE_READ_HOST',
              );
              const port = Number(
                configService.get<string>('APP_DATABASE_PORT') ?? 5432,
              );
              const username = configService.get<string>(
                'APP_DATABASE_USERNAME',
              );
              const password = configService.get<string>(
                'APP_DATABASE_PASSWORD',
              );
              const database = configService.get<string>(
                'APP_DATABASE_DATABASE',
              );
              const schema = configService.get<string>('APP_DATABASE_SCHEMA');
              const ssl = configService.get<string>(
                'APP_DATABASE_SSL',
                'false',
              );
              const max = Number(
                configService.get<string>('APP_DATABASE_POOL_MAX') ?? 5,
              );
              const acquire = Number(
                configService.get<string>('APP_DATABASE_POOL_ACQUIRE') ?? 60000,
              );
              const idle = Number(
                configService.get<string>('APP_DATABASE_POOL_IDLE') ?? 10000,
              );

              // Global options
              const options: SequelizeOptions = {
                port,
                schema,
                database,
                dialect: 'postgres',
                logging: showLog
                  ? (sql: string) => logger?.debug('Sequelize query.', { sql })
                  : false,
                dialectOptions: {
                  ssl: ssl === 'true' ? { rejectUnauthorized: false } : false,
                  application_name: appName,
                },
                pool: { max, acquire, idle },
              };

              // Is a database cluster?
              if (writeHost && readHost) {
                options.replication = {
                  write: { host: writeHost, username, password },
                  read: readHost.split(' ').map((host) => {
                    return { host, username, password };
                  }),
                };
              } else {
                options.host = host;
                options.password = password;
                options.username = username;
              }

              // Create a Sequelize instance.
              DatabaseModule.sequelize = new Sequelize(options);
            }

            return DatabaseModule.sequelize;
          },
        },
        {
          /**
           * Add Sequelize models to sequelize instance.
           *
           * WARNING: Synchronize all tables if it is a test environment (APP_ENV=test).
           */
          provide: DATABASE_MODEL_PROVIDER,
          inject: [DATABASE_PROVIDER],

          useFactory: async (sequelize: Sequelize) => {
            sequelize.addModels(this.models);
          },
        },
      ],
    };
  }
}
