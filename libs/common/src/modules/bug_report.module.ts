import { Injectable, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Bugsnag, {
  NotifiableError,
  OnErrorCallback,
  Event,
  Client,
} from '@bugsnag/js';
import { Logger } from 'winston';
import { InjectLogger, LoggerModule } from './logger.module';

export interface BugReportConfig {
  APP_BUGSNAG_API_KEY: string;
  APP_BUGSNAG_NOTIFY_RELEASE_STAGES: string;
  APP_ENV: string;
  APP_PATH: string;
}

declare const _BUILD_INFO_: any;

export class BugReportSession {
  constructor(
    private appEnv: string,
    private session: Client,
  ) {}

  async notify(
    error: NotifiableError,
    onError?: OnErrorCallback,
    postReportCallback?: (err: any, event: Event) => void,
  ) {
    if (this.appEnv === 'test') return;

    return this.session.notify(error, onError, postReportCallback);
  }
}

/**
 * Wrapper class to Bugsnag report service.
 */
@Injectable()
export class BugReportService implements OnModuleInit {
  private appEnv: string;

  constructor(
    @InjectLogger() private logger: Logger,
    private configService: ConfigService<BugReportConfig>,
  ) {
    this.logger = this.logger.child({ context: BugReportService.name });
  }

  onModuleInit() {
    this.appEnv = this.configService.get<string>('APP_ENV', 'local');

    if (this.appEnv === 'test') return;

    const apiKey = this.configService.get<string>('APP_BUGSNAG_API_KEY');
    const appVersion = _BUILD_INFO_.package.version;
    const appType = this.configService.get<string>('APP_PATH', 'undefined');
    const releaseStage = this.configService.get<string>('APP_ENV');
    const enabledReleaseStages = this.configService
      .get<string>('APP_BUGSNAG_NOTIFY_RELEASE_STAGES', 'production,staging')
      .split(',')
      .filter((r) => r)
      .map((r) => r.trim());

    Bugsnag.start({
      apiKey,
      appVersion,
      appType,
      releaseStage,
      enabledReleaseStages,
      logger: this.logger,
      metadata: {
        git: _BUILD_INFO_.git,
      },
      autoTrackSessions: false,
    });
  }

  async notify(
    error: NotifiableError,
    onError?: OnErrorCallback,
    postReportCallback?: (err: any, event: Event) => void,
  ) {
    if (this.appEnv === 'test') return;

    return Bugsnag.notify(error, onError, postReportCallback);
  }

  async startSession() {
    if (this.appEnv === 'test') return new BugReportSession(this.appEnv, null);

    const bugsnagSession = Bugsnag.startSession();

    return new BugReportSession(this.appEnv, bugsnagSession);
  }
}

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [BugReportService],
  exports: [BugReportService],
})
export class BugReportModule {}
