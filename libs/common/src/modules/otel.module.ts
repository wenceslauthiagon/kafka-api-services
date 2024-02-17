import {
  Injectable,
  Module,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger } from 'winston';
import { InjectLogger, LoggerModule } from './logger.module';
import { MissingEnvVarException } from '../exceptions';

export interface OtelConfig {
  APP_NAME: string;
  APP_OTEL_TRACE_EXPORT_URL: string;
  APP_OTEL_METRIC_EXPORT_URL: string;
  APP_OTEL_METRIC_EXPORT_INTERVAL_MS: number;
  APP_OTEL_METRIC_EXPORT_TIMEOUT_MS: number;
}

@Injectable()
export class OtelService implements OnModuleInit, OnApplicationShutdown {
  private sdk: NodeSDK;

  constructor(
    private readonly configService: ConfigService<OtelConfig>,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: OtelService.name });
  }

  onApplicationShutdown() {
    this.sdk
      .shutdown()
      .then(() => this.logger.info('Tracing terminated'))
      .catch((error) =>
        this.logger.error('Error terminating tracing', { error }),
      );
  }

  onModuleInit() {
    const appName = this.configService.get<string>('APP_NAME');
    const traceExporterUrl = this.configService.get<string>(
      'APP_OTEL_TRACE_EXPORT_URL',
    );
    const metricExporterUrl = this.configService.get<string>(
      'APP_OTEL_METRIC_EXPORT_URL',
    );

    if (!appName || !traceExporterUrl || !metricExporterUrl) {
      throw new MissingEnvVarException([
        ...(!appName ? ['APP_NAME'] : []),
        ...(!traceExporterUrl ? ['APP_OTEL_TRACE_EXPORT_URL'] : []),
        ...(!metricExporterUrl ? ['APP_OTEL_METRIC_EXPORT_URL'] : []),
      ]);
    }

    const traceExporter = new OTLPTraceExporter({
      url: traceExporterUrl,
      headers: {},
    });

    const metricExporter = new OTLPMetricExporter({
      url: metricExporterUrl,
      headers: {},
    });

    const exportIntervalMillis = Number(
      this.configService.get<number>(
        'APP_OTEL_METRIC_EXPORT_INTERVAL_MS',
        10000,
      ),
    );

    const exportTimeoutMillis = Number(
      this.configService.get<number>('APP_OTEL_METRIC_EXPORT_TIMEOUT_MS', 5000),
    );

    const spanProcessor = new BatchSpanProcessor(traceExporter);

    this.sdk = new NodeSDK({
      traceExporter,
      autoDetectResources: true,
      metricReader: new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis,
        exportTimeoutMillis,
      }),
      instrumentations: [getNodeAutoInstrumentations()],
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: appName,
      }),
      spanProcessor,
    });

    this.sdk.start();
  }
}

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [OtelService],
  exports: [OtelService],
})
export class OtelModule {}
