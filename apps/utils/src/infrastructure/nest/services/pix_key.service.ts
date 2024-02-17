import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { DecodedPixKey, DecodedPixKeyEntity } from '@zro/pix-keys/domain';
import { PixKeyService } from '@zro/utils/application';
import { CreateDecodedPixKeyRequest } from '@zro/pix-keys/interface';
import { CreateDecodedPixKeyServiceKafka } from '@zro/pix-keys/infrastructure';

/**
 * Pix key microservice
 */
export class PixKeyServiceKafka implements PixKeyService {
  static _services: any[] = [CreateDecodedPixKeyServiceKafka];

  private readonly createDecodedPixKeyService: CreateDecodedPixKeyServiceKafka;

  /**
   * Default constructor.
   * @param requestId The request id.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: PixKeyServiceKafka.name });

    this.createDecodedPixKeyService = new CreateDecodedPixKeyServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Create decoded pix key.
   * @param decodedPixKey Decoded pix key.
   * @returns Decoded pix key created.
   */
  async createDecoded(decodedPixKey: DecodedPixKey): Promise<DecodedPixKey> {
    const request = new CreateDecodedPixKeyRequest({
      id: decodedPixKey.id,
      userId: decodedPixKey.user.uuid,
      key: decodedPixKey.key,
      type: decodedPixKey.type,
    });

    const result = await this.createDecodedPixKeyService.execute(request);

    const response = result && new DecodedPixKeyEntity(result);

    return response;
  }
}
