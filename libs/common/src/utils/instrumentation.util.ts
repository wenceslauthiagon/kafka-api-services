import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import {
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} from '@opentelemetry/sdk-metrics';
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { KafkaJsInstrumentation } from 'opentelemetry-instrumentation-kafkajs';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { SequelizeInstrumentation } from 'opentelemetry-instrumentation-sequelize';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis-4';

declare const _BUILD_INFO_: any;

const listInstruments = process.env.APP_INSTRUMENTATION_LIST;
const appName = process.env.APP_NAME ?? 'app-name-not-defined';
const traceExporterUrl = process.env.APP_OTEL_TRACE_EXPORT_URL;
const metricExporterUrl = process.env.APP_OTEL_METRIC_EXPORT_URL;

const exportIntervalMillis = Number(
  process.env.APP_OTEL_METRIC_EXPORT_INTERVAL_MS ?? 10000,
);

const exportTimeoutMillis = Number(
  process.env.APP_OTEL_METRIC_EXPORT_TIMEOUT_MS ?? 5000,
);

let traceExporter: any = null;
let metricExporter: any = null;
let spanProcessor: any = null;

// Is a production environment?
if (traceExporterUrl && metricExporterUrl) {
  traceExporter = new OTLPTraceExporter({
    url: traceExporterUrl,
    headers: {},
  });
  metricExporter = new OTLPMetricExporter({
    url: metricExporterUrl,
    headers: {},
  });
  spanProcessor = new BatchSpanProcessor(traceExporter);
}
// Otherwise...
else {
  traceExporter = new ConsoleSpanExporter();
  metricExporter = new ConsoleMetricExporter();
  spanProcessor = new SimpleSpanProcessor(traceExporter);
}

if (listInstruments) {
  const instruments = {
    KafkaJs: KafkaJsInstrumentation,
    Nest: NestInstrumentation,
    IORedis: IORedisInstrumentation,
    Redis: RedisInstrumentation,
    Pg: PgInstrumentation,
    Http: HttpInstrumentation,
    Express: ExpressInstrumentation,
    Sequelize: SequelizeInstrumentation,
  };

  const instrumentations = Object.keys(instruments)
    .filter((i) => listInstruments.includes(i))
    .map((i) => new instruments[i]());

  const sdk = new NodeSDK({
    traceExporter,
    autoDetectResources: true,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis,
      exportTimeoutMillis,
    }),
    instrumentations,
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: appName,
      [SemanticResourceAttributes.SERVICE_VERSION]:
        _BUILD_INFO_.package.version,
    }),
    spanProcessor,
  });

  sdk.start();

  // Stop sdk before application shutdown.
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.error('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });
}
