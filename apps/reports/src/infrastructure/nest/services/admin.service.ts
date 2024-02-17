import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { Admin, AdminEntity } from '@zro/admin/domain';
import { AdminService } from '@zro/reports/application';
import { GetAdminByIdServiceKafka } from '@zro/admin/infrastructure';

/**
 * Admin microservice
 */
export class AdminServiceKafka implements AdminService {
  static _services: any[] = [GetAdminByIdServiceKafka];

  private readonly getAdminByIdService: GetAdminByIdServiceKafka;

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
    this.logger = logger.child({ context: AdminServiceKafka.name });

    this.getAdminByIdService = new GetAdminByIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Get admin by id service.
   * @param id Admin id.
   * @returns Get a admin by id response.
   */
  async getById(id: number): Promise<Admin> {
    const result = await this.getAdminByIdService.execute({ id });

    const response =
      result && new AdminEntity({ id: result.id, name: result.name });

    return response;
  }
}
