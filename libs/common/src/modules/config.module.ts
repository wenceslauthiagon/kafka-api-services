import { DynamicModule } from '@nestjs/common';
import {
  ConfigModule as NestConfigModule,
  ConfigModuleOptions,
} from '@nestjs/config';

export class ConfigModule {
  static forRoot(options: ConfigModuleOptions): DynamicModule {
    options = Object.assign({}, { isGlobal: true }, options);
    return {
      module: ConfigModule,
      imports: [NestConfigModule.forRoot(options)],
    };
  }
}
