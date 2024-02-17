import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { InjectLogger } from '@zro/common';
import { StorageFileGateway } from '@zro/file-storage/infrastructure';

@Injectable()
export class StorageService {
  constructor(@InjectLogger() private readonly logger: Logger) {
    this.logger = logger.child({ context: StorageService.name });
  }

  getStorageGateway(logger?: Logger): StorageFileGateway {
    return new StorageFileGateway(logger ?? this.logger);
  }
}
