import { Logger } from 'winston';
import { Injectable, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  protos,
  RecaptchaEnterpriseServiceClient,
} from '@google-cloud/recaptcha-enterprise';
import type { CallOptions } from 'google-gax';
import { InjectLogger, LoggerModule } from './logger.module';
import { MissingEnvVarException } from '../exceptions';

export interface RecaptchaModuleConfig {
  APP_ENV: string;
  APP_GOOGLE_RECAPTCHA_FILE_KEY_PATH: string;
  APP_GOOGLE_RECAPTCHA_PROJECT_ID: string;
}

/**
 * Wrapper class to RecaptchaEnterprise Service Client.
 */
@Injectable()
export class RecaptchaService implements OnModuleInit {
  private client: RecaptchaEnterpriseServiceClient;
  private projectPath: string;
  private recaptchaFileKeyPath: string;
  private recaptchaProjectId: string;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly configService: ConfigService<RecaptchaModuleConfig>,
  ) {
    this.logger = this.logger.child({ context: RecaptchaService.name });
  }

  onModuleInit() {
    if (
      ['local', 'test'].includes(
        this.configService.get<string>('APP_ENV', 'local'),
      )
    )
      return;

    this.recaptchaFileKeyPath = this.configService.get<string>(
      'APP_GOOGLE_RECAPTCHA_FILE_KEY_PATH',
    );

    this.recaptchaProjectId = this.configService.get<string>(
      'APP_GOOGLE_RECAPTCHA_PROJECT_ID',
    );

    if (!this.recaptchaFileKeyPath || !this.recaptchaProjectId) {
      throw new MissingEnvVarException([
        ...(!this.recaptchaFileKeyPath
          ? ['APP_GOOGLE_RECAPTCHA_FILE_KEY_PATH']
          : []),
        ...(!this.recaptchaProjectId
          ? ['APP_GOOGLE_RECAPTCHA_PROJECT_ID']
          : []),
      ]);
    }

    this.client = new RecaptchaEnterpriseServiceClient({
      keyFilename: this.recaptchaFileKeyPath,
    });

    this.projectPath = this.client.projectPath(this.recaptchaProjectId);
  }

  async createAssessment(
    request?: protos.google.cloud.recaptchaenterprise.v1.ICreateAssessmentRequest,
    options?: CallOptions,
  ): Promise<
    [
      protos.google.cloud.recaptchaenterprise.v1.IAssessment,
      (
        | protos.google.cloud.recaptchaenterprise.v1.ICreateAssessmentRequest
        | undefined
      ),
      any | undefined,
    ]
  > {
    return this.client.createAssessment(request, options);
  }

  getProjectPath(): string {
    return this.projectPath;
  }
}

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [RecaptchaService],
  exports: [RecaptchaService],
})
export class RecaptchaModule {}
