import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { InjectLogger, MissingEnvVarException } from '@zro/common';
import { ReportGateway } from '@zro/reports/application';
import {
  EguardianConfig,
  EguardianReportGateway,
} from '@zro/e-guardian/infrastructure';

@Injectable()
export class EguardianReportService {
  private exportExternalDest: string;

  constructor(
    private readonly configService: ConfigService<EguardianConfig>,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: EguardianReportService.name });

    this.exportExternalDest = this.configService.get<string>(
      'APP_EGUARDIAN_EXPORT_EXTERNAL_DESTINATION',
    );

    if (!this.exportExternalDest) {
      throw new MissingEnvVarException([
        'APP_EGUARDIAN_EXPORT_EXTERNAL_DESTINATION',
      ]);
    }
  }

  getReportGateway(logger?: Logger): ReportGateway {
    return new EguardianReportGateway(
      logger ?? this.logger,
      this.exportExternalDest,
    );
  }
}
