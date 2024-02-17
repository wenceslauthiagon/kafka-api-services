import { Logger } from 'winston';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import {
  MissingEnvVarException,
  NotImplementedException,
  ProtocolType,
  RecaptchaService,
  InjectLogger,
} from '@zro/common';

interface RecaptchaGuardConfig {
  APP_ENV: string;
  APP_GOOGLE_RECAPTCHA_SCORE_LIMIT: number;
}

/**
 * Recaptcha request body. This class can be extended to provide Recaptcha swagger and
 * validator to a controller request body.
 */
export class RecaptchaBody {
  @ApiProperty({
    description: 'Recaptcha App Key.',
    example: 'recaptcha-app-key',
  })
  @IsString()
  recaptcha_key: string;

  @ApiProperty({
    description: 'Recaptcha Token.',
    example: 'action-token',
  })
  @IsString()
  recaptcha_token: string;

  @ApiProperty({
    description: 'Recaptcha Action.',
    example: 'action-name',
  })
  @IsString()
  recaptcha_action: string;

  constructor(props: Partial<RecaptchaBody>) {
    Object.assign(this, props);
  }
}

@Injectable()
export class RecaptchaGuard implements CanActivate {
  private readonly appEnv: string;
  private readonly recaptchaScoreLimit: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly recaptchaService: RecaptchaService,
    readonly configService: ConfigService<RecaptchaGuardConfig>,
  ) {
    this.logger = logger.child({ context: RecaptchaGuard.name });

    this.appEnv = configService.get<string>('APP_ENV', 'local');
    if (['local', 'test'].includes(this.appEnv)) return;

    this.recaptchaScoreLimit = configService.get<number>(
      'APP_GOOGLE_RECAPTCHA_SCORE_LIMIT',
    );
    if (!this.recaptchaScoreLimit) {
      throw new MissingEnvVarException(['APP_GOOGLE_RECAPTCHA_SCORE_LIMIT']);
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (['local', 'test'].includes(this.appEnv)) return true;

    let request: any = null;

    // Check if it is a HTTP request.
    const protocol = context.getType();
    if (protocol === ProtocolType.HTTP) {
      const ctx = context.switchToHttp();
      request = ctx.getRequest();
    } else {
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }

    const requestId = request.id;
    const logger = this.logger.child({ loggerId: requestId });

    logger.info('Validate reCAPTCHA starting.');

    // Check if reCAPTCHA was defined
    if (
      !request.body?.recaptcha_action ||
      !request.body?.recaptcha_key ||
      !request.body?.recaptcha_token
    ) {
      throw new BadRequestException();
    }

    // Build the assessment request.
    const requestAssessmentRecaptcha = {
      assessment: {
        event: {
          token: request.body.recaptcha_token,
          siteKey: request.body.recaptcha_key,
        },
      },
      parent: this.recaptchaService.getProjectPath(),
    };
    try {
      const [response] = await this.recaptchaService.createAssessment(
        requestAssessmentRecaptcha,
      );

      // Check if the token is valid.
      if (!response.tokenProperties.valid) {
        logger.debug(
          'The reCAPTCHA CreateAssessment call failed because the token was',
          { reason: response.tokenProperties.invalidReason },
        );

        return false;
      }

      if (response.tokenProperties.action === request.body.recaptcha_action) {
        logger.debug('The reCAPTCHA score is.', {
          score: response.riskAnalysis.score,
        });

        response.riskAnalysis.reasons.forEach((reason) => {
          logger.debug('The reCAPTCHA reason is.', { reason });
        });

        if (response.riskAnalysis.score <= this.recaptchaScoreLimit) {
          return false;
        }
      } else {
        logger.debug(
          'The action attribute in your reCAPTCHA tag does not match the action you are expecting to score ',
        );

        return false;
      }

      return true;
    } catch (error) {
      logger.error('Unexpected reCAPTCHA guard error.', {
        code: error?.code,
        details: error?.details,
      });

      return false;
    }
  }
}
