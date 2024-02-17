import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger } from '@zro/common';
import { BankingTedGateway } from '@zro/banking/application';
import {
  TopazioGatewayConfig,
  TopazioAxiosService,
  TopazioBankingTedGateway,
} from '@zro/topazio/infrastructure';

@Injectable()
export class TopazioBankingService {
  private readonly baseTransferUrl: string;
  private readonly topazioTransfer: AxiosInstance;

  constructor(
    private readonly configService: ConfigService<TopazioGatewayConfig>,
    private readonly topazioAxios: TopazioAxiosService,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: TopazioBankingService.name });
    this.baseTransferUrl = this.configService.get<string>(
      'APP_TOPAZIO_TRANSFER_BASE_URL',
    );

    this.topazioTransfer = this.topazioAxios.create({
      baseURL: this.baseTransferUrl,
    });
  }

  getBankingTedGateway(logger?: Logger): BankingTedGateway {
    return new TopazioBankingTedGateway(
      logger ?? this.logger,
      this.topazioTransfer,
    );
  }
}
