import { Logger } from 'winston';
import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger } from '@zro/common';
import { GetStreamQuotationService } from '@zro/quotations/infrastructure';

export interface LoadGetStreamQuotationServiceConfig {
  APP_ENV: string;
}

export const StreamQuotationGatewayController = () => {
  return (target: any) => {
    LoadGetStreamQuotationService.registerService(target);
  };
};

export function StreamQuotationGatewayModule(): ClassDecorator {
  return (target: any) => {
    LoadGetStreamQuotationService.registerModule(target);
  };
}

@Injectable()
export class LoadGetStreamQuotationService {
  /**
   * Registered stream quotation services.
   */
  private static registeredModules = [];
  private static registeredServices: GetStreamQuotationService[] = [];

  /**
   * Store loaded stream quotation services
   */
  private streamServices: GetStreamQuotationService[] = [];

  /**
   * @param logger
   * @param configService
   * @param moduleRef
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly configService: ConfigService<LoadGetStreamQuotationServiceConfig>,
    private moduleRef: ModuleRef,
  ) {
    this.logger = logger.child({ context: LoadGetStreamQuotationService.name });
  }

  /**
   * Register a quotation gateway module to be lazy loadded.
   * @param module Quotation gateway module.
   */
  static registerModule(module: any) {
    this.registeredModules.push(module);
  }

  /**
   * Register a stream quotation service.
   * @param service Stream quotation service.
   */
  static registerService(service: GetStreamQuotationService) {
    this.registeredServices.push(service);
  }

  /**
   * Initialize all quotations sync cron service.
   */
  async loadServices(): Promise<GetStreamQuotationService[]> {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return [];
    }

    // Search if requested module is available
    const registeredModules = LoadGetStreamQuotationService.registeredModules;

    // Search on Nest framework for all services registered.
    for (const registeredModule of registeredModules) {
      // Get all registered module providers
      const providers = Reflect.getMetadata('providers', registeredModule);

      if (!providers?.length) {
        this.logger.warn('No providers registered on module.', {
          moduleName: registeredModule.name,
        });
        continue;
      }

      // Remove not registered services classes.
      const registeredProviders = providers.filter((p) =>
        LoadGetStreamQuotationService.registeredServices.includes(p),
      );

      // Now search for available services instances.
      for (const provider of registeredProviders) {
        // Nest: do the magic! Get service instance.
        const service = this.moduleRef.get<any, GetStreamQuotationService>(
          provider,
          { strict: false },
        );

        // Magic happened?
        if (service) {
          // Save the miracle!
          this.streamServices.push(service);
        }
      }
    }

    if (!this.streamServices.length) {
      this.logger.warn('No stream quotation services found.');
    }

    return this.streamServices;
  }
}
