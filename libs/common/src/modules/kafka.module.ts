import { readFileSync, existsSync } from 'fs';
import { isBoolean } from 'class-validator';
import {
  DynamicModule,
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ClientKafka,
  ClientProxyFactory,
  EventPattern,
  KafkaOptions,
  MessagePattern,
  Transport,
} from '@nestjs/microservices';
import { Logger } from 'winston';
import { Kafka, logLevel } from 'kafkajs';
import { NullPointerException } from '../exceptions/null_pointer.exception';
import { InjectLogger, LoggerModule, LOGGER_SERVICE } from './logger.module';
import { DefaultException } from '../helpers/error.helper';
import { KAFKA_SERVICE } from './kafka.constants';
import {
  MissingEnvVarException,
  NotLoadedKafkaServiceException,
} from '../exceptions';

export interface KafkaConfig {
  APP_NAME: string;
  APP_BROKER_HOSTS: string;
  APP_BROKER_GROUP_ID: string;
  APP_BROKER_MAX_RETRY_TIME: number;
  APP_BROKER_INITIAL_RETRY_TIME: number;
  APP_BROKER_RETRIES: number;
  APP_BROKER_NUM_PARTITIONS: number;
  APP_BROKER_REPLICATION_FACTOR: number;
  APP_BROKER_ENABLE_TLS: boolean;
  APP_BROKER_KEY_FILE: string;
  APP_BROKER_CERT_FILE: string;
  APP_BROKER_CA_FILE: string;
  APP_BROKER_REJECT_UNAUTHORIZED: boolean;
  APP_BROKER_CONNECTION_TIMEOUT: number;
  APP_BROKER_REQUEST_TIMEOUT: number;
  APP_BROKER_CONSUMER_SESSION_TIMEOUT: number;
  APP_BROKER_CONSUMER_HEARTBEAT_INTERVAL: number;
  APP_BROKER_CONSUMER_PARTITIONS_CONSUMED_CONCURRENTLY: number;
  APP_BROKER_PRODUCER_SEND_ACKS: number;
  APP_BROKER_TOPIC_PREFIX: string;
}

export function createKafkaTransport(
  configService: ConfigService<KafkaConfig>,
  logger: Logger,
): KafkaOptions {
  const toWinstonLogLevel = (level: logLevel): string => {
    switch (level) {
      case logLevel.ERROR:
      case logLevel.NOTHING:
        return 'error';
      case logLevel.WARN:
        return 'warn';
      case logLevel.INFO:
        return 'info';
      case logLevel.DEBUG:
        return 'debug';
    }
  };

  const toKafkaJsLogLevel = (level: string): logLevel => {
    switch (level) {
      case 'error':
        return logLevel.ERROR;
      case 'warn':
        return logLevel.WARN;
      case 'info':
        return logLevel.INFO;
      case 'debug':
        return logLevel.DEBUG;
      default:
        return logLevel.NOTHING;
    }
  };

  const winstonLogCreator = () => {
    return ({ level, log }) => {
      const { message, ...extra } = log;
      logger.log({
        level: toWinstonLogLevel(level),
        message,
        extra,
      });
    };
  };

  const appName = configService.get<string>('APP_NAME', 'no name');
  const brokers = configService.get<string>('APP_BROKER_HOSTS');
  const groupId = configService.get<string>('APP_BROKER_GROUP_ID');

  if (!brokers || !groupId) {
    throw new MissingEnvVarException([
      ...(!brokers ? ['APP_BROKER_HOSTS'] : []),
      ...(!groupId ? ['APP_BROKER_GROUP_ID'] : []),
    ]);
  }

  const initialRetryTime = Number(
    configService.get<number>('APP_BROKER_INITIAL_RETRY_TIME', 300),
  );
  const retries = Number(configService.get<number>('APP_BROKER_RETRIES', 300));
  const maxRetryTime = Number(
    configService.get<number>('APP_BROKER_MAX_RETRY_TIME', 30000),
  );
  const connectionTimeout = Number(
    configService.get<number>('APP_BROKER_CONNECTION_TIMEOUT', 1000),
  );
  const requestTimeout = Number(
    configService.get<number>('APP_BROKER_REQUEST_TIMEOUT', 25000),
  );
  // large enough to fit any message being processed
  const sessionTimeout = Number(
    configService.get<number>('APP_BROKER_CONSUMER_SESSION_TIMEOUT', 10000),
  );
  // Up to 1/3 of the session timeout
  const heartbeatInterval = Number(
    configService.get<number>('APP_BROKER_CONSUMER_HEARTBEAT_INTERVAL', 3000),
  );
  const partitionsConsumedConcurrently = Number(
    configService.get<number>(
      'APP_BROKER_CONSUMER_PARTITIONS_CONSUMED_CONCURRENTLY',
      1,
    ),
  );
  // Default is -1 (waits for everyone to acknowledge)
  const sendAcksValue = Number(
    configService.get<number>('APP_BROKER_PRODUCER_SEND_ACKS', -1),
  );

  const options: KafkaOptions['options'] = {
    client: {
      clientId: appName,
      brokers: brokers.split(','),
      retry: { initialRetryTime, retries, maxRetryTime },
      connectionTimeout,
      requestTimeout,
      logLevel: toKafkaJsLogLevel(logger.level),
      logCreator: winstonLogCreator,
    },
    consumer: { groupId, sessionTimeout, heartbeatInterval },
    send: { acks: sendAcksValue },
    run: { partitionsConsumedConcurrently },
  };

  const enalbleTls =
    configService.get<string>('APP_BROKER_ENABLE_TLS', 'false') === 'true';

  if (enalbleTls) {
    const keyFile = configService.get<string>('APP_BROKER_KEY_FILE', null);
    const certFile = configService.get<string>('APP_BROKER_CERT_FILE', null);
    const caFile = configService.get<string>('APP_BROKER_CA_FILE', null);

    const rejectUnauthorized =
      configService.get<string>('APP_BROKER_REJECT_UNAUTHORIZED', 'true') ===
      'true';

    options.client.ssl = {
      rejectUnauthorized,
    };

    const isSafeTLS =
      existsSync(keyFile) && existsSync(certFile) && existsSync(caFile);

    if (isSafeTLS) {
      // Load https certificates
      options.client.ssl = {
        rejectUnauthorized,
        key: readFileSync(keyFile),
        cert: readFileSync(certFile),
        ca: [readFileSync(caFile)],
      };
    }
  }

  return {
    transport: Transport.KAFKA,
    options,
  };
}

export const KafkaConfigService = {
  provide: KAFKA_SERVICE,
  inject: [ConfigService, LOGGER_SERVICE],
  useFactory: async (
    configService: ConfigService<KafkaConfig>,
    logger: Logger,
  ) => {
    return ClientProxyFactory.create(
      createKafkaTransport(configService, logger),
    );
  },
};

function applyPrefix(prefix: string, topic: string) {
  if (!prefix) return topic;

  return `${prefix}.${topic}`;
}

/**
 * Automatically subscribe to all dependency topics and connect to Kafka.
 */
@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  /**
   * Created and subscribed topics.
   */
  private static topics: string[] = [];

  /**
   * Created events.
   */
  private static events: string[] = [];

  /**
   * Default number of partitions for each topic.
   */
  private numPartitions: number;

  /**
   * Default replication for each topic.
   */
  private replicationFactor: number;

  /**
   * Topic prefix
   */
  private topicPrefix: string;

  /**
   * Default constructor.
   * @param clientKafka Kafka client
   * @param logger Global logger.
   */
  constructor(
    @Inject(KAFKA_SERVICE) private readonly clientKafka: ClientKafka,
    private readonly configService: ConfigService<KafkaConfig>,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: KafkaService.name });

    this.numPartitions = parseInt(
      this.configService.get<string>('APP_BROKER_NUM_PARTITIONS', '1'),
    );
    this.replicationFactor = parseInt(
      this.configService.get<string>('APP_BROKER_REPLICATION_FACTOR', '1'),
    );
    this.topicPrefix = this.configService.get<string>(
      'APP_BROKER_TOPIC_PREFIX',
      null,
    );
  }

  /**
   * Add topicPrefix to topic.
   * @param topic Topic to add a prefix.
   * @returns Topic with prefix.
   */
  private getTopicPrefix(topic: string): string {
    return applyPrefix(this.topicPrefix, topic);
  }

  /**
   * Add topic to subscription list;
   * @param topics The topic to subscribe to.
   */
  static subscribe(topics: string[] | string): void {
    if (!Array.isArray(topics)) {
      topics = [topics];
    }

    topics
      .filter((topic) => !this.topics.includes(topic))
      .forEach((topic) => this.topics.push(topic));
  }

  /**
   * Add topic to subscription list;
   * @param topics The topic to subscribe to.
   */
  subscribe(topics: string[] | string): void {
    KafkaService.subscribe(topics);
  }

  /**
   * Add topic to subscription list;
   * @param events The event to create.
   */
  static createEvents(events: string[] | string): void {
    if (!Array.isArray(events)) {
      events = [events];
    }

    events
      .filter((event) => !this.events.includes(event))
      .forEach((event) => this.events.push(event));
  }

  /**
   * Add topic to subscription list;
   * @param events The event to create.
   */
  createEvents(events: string[] | string): void {
    KafkaService.createEvents(events);
  }

  /**
   * Create topics if needed and wait for leader election.
   */
  async createTopics(
    patterns: string[] = [],
    events: string[] = [],
  ): Promise<void> {
    // Are there any topics or events to create?
    if (patterns.length || events.length) {
      // Check if all topics are available.
      const client = this.clientKafka.createClient<Kafka>();
      const admin = client.admin();
      await admin.connect();

      // Build a list of all needed topics.
      let topics: string[] = [
        ...patterns,
        ...patterns.map((item) => `${item}.reply`),
        ...events,
      ];

      // Add topic prefix.
      topics = topics.map((topic) => this.getTopicPrefix(topic));

      const numPartitions = this.numPartitions;
      const replicationFactor = this.replicationFactor;

      // Fetch existing topics.
      let knownTopics = (await admin.listTopics()) || [];

      if (this.topicPrefix) {
        knownTopics = knownTopics.filter((topic) =>
          topic.startsWith(this.topicPrefix),
        );
      }

      this.logger.info('Known topics.', { topics: knownTopics });

      this.logger.info('Requested topics', { topics });

      // Search for new topics.
      const createTopics =
        topics
          .filter((t) => !knownTopics.includes(t))
          .map((topic) => ({ topic, numPartitions, replicationFactor })) || [];

      this.logger.info('Create missing topics and wait for leader election.', {
        topics: createTopics,
      });

      // If there are unavailable topics, create and wait for the leader election.
      for (const newTopic of createTopics) {
        this.logger.debug('Creating topic.', { newTopic });

        await admin.createTopics({
          waitForLeaders: true,
          timeout: 120000,
          topics: [newTopic],
        });
      }

      // Fetch for topic metada.
      const topicInfos = await admin.fetchTopicMetadata({ topics });

      // Get topics that don't have enough partitions.
      const createPartitions =
        topicInfos?.topics
          .filter((t) => t.partitions.length < numPartitions)
          .filter((t) => topics.includes(t.name))
          .map((t) => ({ topic: t.name, count: numPartitions })) || [];

      // If there are missing partitions, then create new ones.
      for (const newPartition of createPartitions) {
        this.logger.info('Create missing partition.', { newPartition });

        await admin.createPartitions({
          timeout: 120000,
          topicPartitions: [newPartition],
        });
      }

      // We are done!
      await admin.disconnect();

      this.logger.info('Topics and partitions created.', {
        topics: createTopics.length,
        partitions: createPartitions.length,
      });
    }
  }

  /**
   * Subscribe consumer to reply topics.
   */
  private async subscribeReplyTopics(): Promise<void> {
    // Are there any reply topics to subscribe?
    if (KafkaService.topics.length) {
      // Subscribing to reply topics.
      KafkaService.topics.forEach((topic) =>
        this.clientKafka.subscribeToResponseOf(this.getTopicPrefix(topic)),
      );
    }
  }

  /**
   * On module init hook to subscribe kafka client to all dependency topics.
   */
  async onModuleInit(): Promise<void> {
    // Subscribe for reply topics.
    await this.subscribeReplyTopics();

    // Connect to kafka.
    await this.clientKafka.connect();
  }

  /**
   * Close Kafka connections before dying.
   */
  async onModuleDestroy(): Promise<void> {
    await this.clientKafka.close();
  }

  /**
   * Proxy send function to client kafka.
   * @param pattern Topic name.
   * @param data Message data.
   * @returns Reply message.
   */
  async send<TResult = any, TInput = any>(
    pattern: any,
    data: TInput,
  ): Promise<TResult> {
    // Sanity check.
    if (!pattern) {
      throw new NullPointerException('Pattern is required.');
    }

    let logger = this.logger;

    // Apply topic prefix
    pattern = this.getTopicPrefix(pattern);

    // Get logger id
    if (data?.['headers'] && data?.['headers']?.['requestId']) {
      const headers = data['headers'];
      logger = logger.child({ loggerId: headers.requestId });
      data['key'] = headers.requestId;
    }

    try {
      logger.debug('Send kafka message.', { pattern, data });

      // Call microservice.
      const result = await this.clientKafka
        .send<TResult, TInput>(pattern, data)
        .toPromise();

      logger.debug('Replied kafka message.', { result });

      return result;
    } catch (error) {
      logger.error('Received kafka error message.', error);

      if (
        'code' in error &&
        DefaultException.registeredExceptions[error.code]
      ) {
        const RegisteredException: any =
          DefaultException.registeredExceptions[error.code];

        const exception: DefaultException = new RegisteredException();
        exception.data = error.data;
        exception.causedByStack = error.causedByStack;

        throw exception;
      } else if (
        error.message?.includes(
          'The client consumer did not subscribe to the corresponding reply topic',
        )
      ) {
        const exception = new NotLoadedKafkaServiceException(pattern);
        exception.causedByStack = [error.stask];

        throw exception;
      }

      throw new DefaultException(error);
    }
  }

  /**
   * Proxy emit function to client kafka.
   * @param pattern Topic name.
   * @param data Event data.
   * @returns Reply message.
   */
  async emit<TResult = any, TInput = any>(
    pattern: any,
    data: TInput,
  ): Promise<TResult> {
    // Sanity check.
    if (!pattern) {
      throw new NullPointerException('Pattern is required.');
    }

    let logger = this.logger;

    // Apply topic prefix
    pattern = this.getTopicPrefix(pattern);

    try {
      // Get logger id
      if (data?.['headers'] && data?.['headers']?.['requestId']) {
        const headers = data['headers'];
        logger = logger.child({ loggerId: headers.requestId });
        data['key'] = headers.requestId;
      }

      logger.debug('Fire kafka event.', { pattern, data });

      // Send event.
      const result = await this.clientKafka
        .emit<TResult, TInput>(pattern, data)
        .toPromise();

      logger.debug('Replied kafka event.', { result });

      return result;
    } catch (error) {
      logger.error('Received kafka error event.', error);

      throw new DefaultException(error);
    }
  }
}

/**
 * Kafka client required constructor to be used in KafkaServiceParam decorator.
 */
export interface RemoteKafkaService {
  requestId: string;
  logger: Logger;
  kafkaService: KafkaService;
}

interface RemoteKafkaServiceConstructor {
  _services?: any[];
  _cacheVerify?: boolean;

  new (
    requestId: string,
    logger: Logger,
    kafkaService: KafkaService,
  ): RemoteKafkaService;
}

export class KafkaModule {
  // FIXME: remove this any
  static services: any = {};

  static forFeature(services: any[] = []): DynamicModule {
    services.forEach((service) => {
      this.services[service.name] = service;
      KafkaService.subscribe(service._services ?? []);
    });

    return {
      module: KafkaModule,
      imports: [ConfigModule, LoggerModule],
      providers: [KafkaConfigService, KafkaService],
      exports: [KafkaConfigService, KafkaService],
    };
  }

  static getService(ctor: RemoteKafkaServiceConstructor): boolean {
    // Check if this ctor is already verified.
    if (isBoolean(ctor._cacheVerify)) {
      return ctor._cacheVerify;
    }

    // If not, check ctor name in service list.
    if (this.services[ctor.name]) {
      ctor._cacheVerify = true;
      return true;
    }

    // If not, check if this ctor has services in service list
    // and save the verify value on _cacheVerify.
    ctor._cacheVerify =
      !!ctor._services?.length &&
      ctor._services.every((service) => this.services[service.name]);
    return ctor._cacheVerify;
  }

  static createRemoteKafkaService(
    ctor: RemoteKafkaServiceConstructor,
    requestId: string,
    logger: Logger,
    kafkaService: KafkaService,
  ) {
    if (!this.getService(ctor)) {
      throw new NotLoadedKafkaServiceException(ctor.name);
    }

    return new ctor(requestId, logger, kafkaService);
  }
}

export const KAFKA_CLIENT_SERVICE = 'KAFKA_CLIENT_SERVICE';

export const KafkaSubscribeService = (services: string[] | string) => {
  /* eslint-disable @typescript-eslint/ban-types */
  return <T extends { new (...args: any[]): {} }>(className: T) => {
    const newClass = class extends className {
      static _services: string[] = Array.isArray(services)
        ? services
        : [services];
    };
    // Only to keep the original class name.
    Object.defineProperty(newClass, 'name', { value: className.name });
    return newClass;
  };
};

export const KafkaCreateEvent = (events: string[] | string) => {
  /* eslint-disable @typescript-eslint/ban-types */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  return <T extends { new (...args: any[]): {} }>(className: T) => {
    KafkaService.createEvents(events);
  };
};

const TOPIC_PREFIX = process.env.APP_BROKER_TOPIC_PREFIX;

export function KafkaMessagePattern(pattern: string): MethodDecorator {
  pattern = applyPrefix(TOPIC_PREFIX, pattern);
  return MessagePattern(pattern);
}

export function KafkaEventPattern(pattern: string): MethodDecorator {
  pattern = applyPrefix(TOPIC_PREFIX, pattern);
  return EventPattern(pattern);
}
