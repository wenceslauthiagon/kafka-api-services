import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { Holiday, HolidayEntity } from '@zro/quotations/domain';
import { QuotationService } from '@zro/banking/application';
import { GetHolidayByDateServiceKafka } from '@zro/quotations/infrastructure';
import { GetHolidayByDateRequest } from '@zro/quotations/interface';

export class QuotationServiceKafka implements QuotationService {
  static _services: any[] = [GetHolidayByDateServiceKafka];

  private readonly getHolidayByDateService: GetHolidayByDateServiceKafka;

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
    this.logger = logger.child({ context: QuotationServiceKafka.name });

    this.getHolidayByDateService = new GetHolidayByDateServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  async getHolidayByDate(date: Date): Promise<Holiday> {
    const payload = new GetHolidayByDateRequest({ date });

    const response = await this.getHolidayByDateService.execute(payload);

    if (!response) return null;

    const holiday = new HolidayEntity({
      id: response.id,
      type: response.type,
      level: response.level,
      createdAt: response.createdAt,
    });

    return holiday;
  }
}
