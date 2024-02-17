import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger } from '@zro/common';
import { GetAllBankPspGateway } from '@zro/banking/application';
import {
  JdpiGatewayConfig,
  JdpiBankGateway,
  JdpiAxiosService,
} from '@zro/jdpi/infrastructure';

@Injectable()
export class JdpiBankService {
  private readonly jdpiInstance: AxiosInstance;

  constructor(
    configService: ConfigService<JdpiGatewayConfig>,
    jdpiAxios: JdpiAxiosService,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: JdpiBankService.name });

    const baseURL = configService.get<string>('APP_JDPI_BASE_URL');

    this.jdpiInstance = jdpiAxios.create({ baseURL });
  }

  getBankGateway(logger?: Logger): GetAllBankPspGateway {
    return new JdpiBankGateway(logger ?? this.logger, this.jdpiInstance);
  }
}
