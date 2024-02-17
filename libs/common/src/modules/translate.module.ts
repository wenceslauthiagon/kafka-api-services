import { Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { I18nJsonLoader, I18nModule, I18nService } from 'nestjs-i18n';
import { snakeCase } from 'snake-case';
import { Logger } from 'winston';
import { ValidationException } from '../exceptions';
import { DefaultException } from '../helpers';
import { InjectLogger, LoggerModule } from './logger.module';

@Injectable()
export class TranslateService {
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly i18n: I18nService,
  ) {
    this.logger = this.logger.child({ context: TranslateService.name });
  }

  async translate(file: string, token: string, args?: any): Promise<string> {
    const translationToken = `${file}.${token}`;

    // If there is no translation service configured.
    if (!this.i18n) {
      return Promise.resolve(translationToken);
    }

    let message: string = await this.i18n.translate(translationToken, { args });

    // If translation token was not found, then use the default one.
    if (message.startsWith(file)) {
      this.logger.warn('Translation not found.', { translationToken });
      message = await this.i18n.translate(`${file}.DEFAULT`);
    }

    return message;
  }

  async translateException(
    file: string,
    exception: DefaultException,
  ): Promise<string> {
    // If is not a validation exception, then use code as translation key.
    if (exception.code !== ValidationException.code) {
      return this.translate(file, exception.code, exception.data);
    }
    // Else translate all validation errors.
    else {
      const messages = [];
      for (const error of exception.data) {
        for (const constraint in error.constraints) {
          const constraintCode =
            snakeCase(constraint)?.toUpperCase() ?? 'DEFAULT';
          const message = await this.translate(file, constraintCode, error);
          messages.push(message);
        }
      }
      return messages.join(' ');
    }
  }
}

interface TranslateConfig {
  APP_TRANSLATE_PATH: string;
}

@Module({
  imports: [
    LoggerModule,
    I18nModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<TranslateConfig>) => {
        const path = configService.get<string>(
          'APP_TRANSLATE_PATH',
          'assets/i18n/',
        );
        return {
          fallbackLanguage: 'pt-BR', // e.g., 'en'
          loaderOptions: { path },
        };
      },
      loader: I18nJsonLoader,
      inject: [ConfigService],
    }),
  ],
  providers: [TranslateService],
  exports: [TranslateService],
})
export class TranslateModule {}
