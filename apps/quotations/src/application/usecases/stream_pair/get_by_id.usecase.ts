import { MissingDataException } from '@zro/common';
import { StreamPair, StreamPairRepository } from '@zro/quotations/domain';
import { Logger } from 'winston';

export class GetStreamPairByIdUseCase {
  constructor(
    private logger: Logger,
    private streamPairRepository: StreamPairRepository,
  ) {
    this.logger = logger.child({ context: GetStreamPairByIdUseCase.name });
  }

  async execute(id: string): Promise<StreamPair> {
    if (!id) {
      throw new MissingDataException(['id']);
    }

    this.logger.debug('Get stream pair', { id });

    return this.streamPairRepository.getById(id);
  }
}
