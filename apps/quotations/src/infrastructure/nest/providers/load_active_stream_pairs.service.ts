import { Logger } from 'winston';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectLogger, RedisKey, RedisService } from '@zro/common';
import { StreamPair, StreamPairEntity } from '@zro/quotations/domain';
import {
  CACHE,
  StreamPairDatabaseRepository,
} from '@zro/quotations/infrastructure';
import {
  GetAllStreamPairController,
  GetAllStreamPairRequest,
  GetAllStreamPairRequestSort,
} from '@zro/quotations/interface';

export class LoadActiveStreamPairService
  implements OnModuleInit, OnModuleDestroy
{
  private bootTimeout: NodeJS.Timeout;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({ context: LoadActiveStreamPairService.name });
  }

  async onModuleInit() {
    this.bootTimeout = setTimeout(async () => {
      await this.loadActiveStreamPairs();
    }, 0);
  }

  onModuleDestroy() {
    this.bootTimeout && clearTimeout(this.bootTimeout);
  }

  async getActiveStreamPairs(): Promise<StreamPair[]> {
    const streamPairs = await this.redisService
      .get<StreamPair[]>(CACHE.STREAM_PAIRS)
      .then((key) => key?.data?.map((item) => new StreamPairEntity(item)));

    return streamPairs ?? [];
  }

  async loadActiveStreamPairs(): Promise<void> {
    let streamPairs: StreamPair[] = [];
    try {
      this.bootTimeout = null;
      this.logger.debug('Load active streamPairs.');

      streamPairs = await this.loadStreamPairs();
      await this.setActiveStreamPairs(streamPairs);
    } catch (error) {
      this.logger.error('No active streamPairs found.', { stack: error.stack });
    } finally {
      if (!streamPairs.length) {
        this.bootTimeout = setTimeout(async () => {
          await this.loadActiveStreamPairs();
        }, 10000);
      }
    }
  }

  async setActiveStreamPairs(streamPairs: StreamPair[]): Promise<void> {
    this.logger.debug('Set active streamPairs.', { streamPairs });

    const data: RedisKey<StreamPair[]> = {
      key: CACHE.STREAM_PAIRS,
      data: streamPairs,
    };

    await this.redisService.set<StreamPair[]>(data);
  }

  private async loadStreamPairs(): Promise<StreamPair[]> {
    const logger = this.logger;
    const streamPairRepository = new StreamPairDatabaseRepository();

    const streamPairs: StreamPair[] = [];

    const getAllStreamPairsIterable = {
      [Symbol.asyncIterator]() {
        return {
          i: 1,
          total: 0,
          async next() {
            // Build get all streamPairs microservice.
            const getAllStreamPairService = new GetAllStreamPairController(
              logger,
              streamPairRepository,
            );

            // Get only active streamPairs
            const getAllStreamPairServiceRequest = new GetAllStreamPairRequest({
              active: true,
              sort: GetAllStreamPairRequestSort.ID,
              page: this.i++,
              pageSize: 100,
            });

            // Get an page of streamPairs.
            const pageStreamPairs = await getAllStreamPairService.execute(
              getAllStreamPairServiceRequest,
            );

            // Remember how many streamPairs were loaded.
            this.total += pageStreamPairs.pageTotal;

            return {
              value: pageStreamPairs,
              done: !pageStreamPairs.data?.length,
            };
          },
        };
      },
    };

    // Iterate over all gotten pages.
    for await (const pageStreamPairs of getAllStreamPairsIterable) {
      pageStreamPairs.data.forEach((item) =>
        streamPairs.push(new StreamPairEntity(item)),
      );
    }

    return streamPairs;
  }
}
