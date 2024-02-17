import { Logger } from 'winston';
import { AdminRepository } from '@zro/admin/domain';
import {
  ChangeAdminPasswordUseCase,
  HashProvider,
} from '@zro/admin/application';

export interface ChangeAdminPasswordRequest {
  id: number;
  password: string;
  confirmPassword: string;
  verificationCode: string;
}

export class ChangeAdminPasswordController {
  private usecase: ChangeAdminPasswordUseCase;

  constructor(
    private logger: Logger,
    private adminRepository: AdminRepository,
    private hashProvider: HashProvider,
  ) {
    this.logger = logger.child({
      context: ChangeAdminPasswordController.name,
    });
    this.usecase = new ChangeAdminPasswordUseCase(
      this.logger,
      this.adminRepository,
      this.hashProvider,
    );
  }

  async execute(request: ChangeAdminPasswordRequest): Promise<void> {
    const { id, confirmPassword, password, verificationCode } = request;

    this.logger.debug('Request of change admin password in execution.', {
      verificationCode,
    });

    await this.usecase.execute(id, password, confirmPassword, verificationCode);
  }
}
