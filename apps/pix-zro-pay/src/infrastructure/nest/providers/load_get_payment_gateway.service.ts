import { Logger } from 'winston';
import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger } from '@zro/common';
import { GetPaymentGatewayService } from '@zro/pix-zro-pay/infrastructure';

export interface LoadGetPaymentGatewayServiceConfig {
  APP_ENV: string;
}

export const PaymentGatewayServiceController = () => {
  return (target: any) => {
    LoadGetPaymentGatewayService.registerService(target);
  };
};

export function PaymentGatewayServiceModule(): ClassDecorator {
  return (target: any) => {
    LoadGetPaymentGatewayService.registerModule(target);
  };
}

@Injectable()
export class LoadGetPaymentGatewayService {
  /**
   * Registered payment gateway services.
   */
  private static registeredModules = [];
  private static registeredServices: GetPaymentGatewayService[] = [];

  /**
   * Store loaded payment gateway services
   */
  private paymentGatewayService: GetPaymentGatewayService[] = [];

  /**
   * @param logger
   * @param configService
   * @param moduleRef
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly configService: ConfigService<LoadGetPaymentGatewayServiceConfig>,
    private moduleRef: ModuleRef,
  ) {
    this.logger = logger.child({ context: LoadGetPaymentGatewayService.name });
  }

  /**
   * Register a quotation gateway module to be lazy loadded.
   * @param module Quotation gateway module.
   */
  static registerModule(module: any) {
    this.registeredModules.push(module);
  }

  /**
   * Register a payment gateway service.
   * @param service Payment gateway service.
   */
  static registerService(service: GetPaymentGatewayService) {
    this.registeredServices.push(service);
  }

  async loadServices(): Promise<GetPaymentGatewayService[]> {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return [];
    }

    // Search if requested module is available
    const registeredModules = LoadGetPaymentGatewayService.registeredModules;

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
        LoadGetPaymentGatewayService.registeredServices.includes(p),
      );

      // Now search for available services instances.
      for (const provider of registeredProviders) {
        // Nest: do the magic! Get service instance.
        const service = this.moduleRef.get<any, GetPaymentGatewayService>(
          provider,
          {
            strict: false,
          },
        );

        // Magic happened?
        if (service) {
          // Save the miracle!
          this.paymentGatewayService.push(service);
        }
      }
    }

    if (!this.paymentGatewayService.length) {
      this.logger.warn('No payment gateway services found.');
    }

    return this.paymentGatewayService;
  }
}
