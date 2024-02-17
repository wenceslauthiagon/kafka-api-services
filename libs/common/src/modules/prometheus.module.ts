import { Logger } from 'winston';
import { PrometheusDriver, SampleValue } from 'prometheus-query';
import {
  Gauge,
  LabelValues,
  PrometheusContentType,
  Pushgateway,
  register,
} from 'prom-client';
import { Injectable, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DefaultException, Exception, ExceptionTypes } from '../helpers';
import { MissingEnvVarException } from '../exceptions';
import { InjectLogger, LoggerModule } from './logger.module';

@Exception(ExceptionTypes.SYSTEM, 'PROMETHEUS_QUERY_RESULT')
export class PrometheusQueryResultException extends DefaultException {
  constructor(data: any) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'PROMETHEUS_QUERY_RESULT',
      data,
    });
  }
}

export interface PrometheusConfig {
  APP_ENV: string;
  APP_PATH: string;
  APP_NAME: string;
  APP_EXCHANGE: string;
  APP_INSTANCE_ID: string; // HOSTNAME at k8s
  APP_PROMETHEUS_PUSHGATEWAY_BASE_URL: string;
  APP_PROMETHEUS_BASE_URL: string;
}

interface PrometheusClient {
  prometheus: PrometheusDriver;
  pushgateway: Pushgateway<PrometheusContentType>;
}

interface DefaultLabelValues {
  appName: string;
  exchange: string;
  instanceId: string;
}

export interface PrometheusSet {
  name: string;
  help: string;
  labels: LabelValues<string>;
  value: number;
}

interface Metric {
  labels: Record<string, any>;
}

export type PrometheusGetResponse = {
  metric: Metric;
  values: SampleValue[];
};

@Injectable()
export class PrometheusService implements OnModuleInit {
  private prometheus: PrometheusClient['prometheus'];
  private pushgateway: PrometheusClient['pushgateway'];
  private jobName: string;
  private labelNames: DefaultLabelValues;

  constructor(
    private configService: ConfigService<PrometheusConfig>,
    @InjectLogger() private logger: Logger,
  ) {
    this.logger = logger.child({ context: PrometheusService.name });
  }

  onModuleInit(): void {
    if (this.configService.get<string>('APP_ENV') === 'test') return;

    this.jobName = this.configService.get<string>('APP_NAME');
    this.labelNames = {
      appName: this.configService.get<string>('APP_PATH'),
      exchange: this.configService.get<string>('APP_EXCHANGE'),
      instanceId: this.configService.get<string>('APP_INSTANCE_ID', '1'),
    };
    const prometheusBaseUrl = this.configService.get<string>(
      'APP_PROMETHEUS_BASE_URL',
    );
    const pushgatewayBaseUrl = this.configService.get<string>(
      'APP_PROMETHEUS_PUSHGATEWAY_BASE_URL',
    );
    if (
      !this.jobName ||
      !this.labelNames.appName ||
      !prometheusBaseUrl ||
      !pushgatewayBaseUrl
    ) {
      throw new MissingEnvVarException([
        ...(!this.jobName ? ['APP_NAME'] : []),
        ...(!this.labelNames.appName ? ['APP_PATH'] : []),
        ...(!this.labelNames.instanceId ? ['APP_INSTANCE_ID'] : []),
        ...(!prometheusBaseUrl ? ['APP_PROMETHEUS_BASE_URL'] : []),
        ...(!pushgatewayBaseUrl ? ['APP_PROMETHEUS_PUSHGATEWAY_BASE_URL'] : []),
      ]);
    }

    this.prometheus = new PrometheusDriver({ endpoint: prometheusBaseUrl });
    this.pushgateway = new Pushgateway(pushgatewayBaseUrl);

    this.logger.info('Prometheus connected!', {
      prometheusBaseUrl,
      pushgatewayBaseUrl,
    });
  }

  getClient(): PrometheusClient {
    return {
      prometheus: this.prometheus,
      pushgateway: this.pushgateway,
    };
  }

  // TODO: improve this gauge conditional to support other types.
  private getGaugeMetric(
    name: string,
    help: string,
    labelNames: string[],
  ): Gauge {
    let metric = register.getSingleMetric(name) as Gauge;
    if (!metric) {
      metric = new Gauge({ name, help, labelNames });
    }
    return metric;
  }

  async set(body: PrometheusSet[] | PrometheusSet): Promise<void> {
    if (!Array.isArray(body)) {
      body = [body];
    }

    for (const item of body) {
      const labels = { ...item.labels, ...this.labelNames };
      const labelNames = Object.keys(labels);

      const metric = this.getGaugeMetric(item.name, item.help, labelNames);
      metric.set(labels, item.value);
    }

    await this.pushgateway.pushAdd({ jobName: this.jobName });
  }

  async get(query: string): Promise<PrometheusGetResponse[]> {
    try {
      const data = await this.prometheus.instantQuery(query);
      return data?.result ?? [];
    } catch (error) {
      this.logger.error('Unexpected Prometheus query error.', {
        data: error.data,
        status: error.status,
      });

      throw new PrometheusQueryResultException(error.data);
    }
  }
}

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [PrometheusService],
  exports: [PrometheusService],
})
export class PrometheusModule {}
