import { Logger } from 'winston';
import { GetAdminByEmailUseCase } from '@zro/admin/application';
import { Admin, AdminRepository } from '@zro/admin/domain';

export interface GetAdminByEmailRequest {
  email: string;
}

export interface GetAdminByEmailResponse {
  id: number;
  password: string;
  email: string;
}

function getAdminByEmailPresenter(admin: Admin): GetAdminByEmailResponse {
  if (!admin) return null;

  const response: GetAdminByEmailResponse = {
    id: admin.id,
    password: admin.password,
    email: admin.email,
  };

  return response;
}

export class GetAdminByEmailController {
  private usecase: GetAdminByEmailUseCase;

  constructor(
    private logger: Logger,
    adminRepository: AdminRepository,
  ) {
    this.logger = logger.child({
      context: GetAdminByEmailController.name,
    });
    this.usecase = new GetAdminByEmailUseCase(this.logger, adminRepository);
  }

  async execute(
    request: GetAdminByEmailRequest,
  ): Promise<GetAdminByEmailResponse> {
    const { email } = request;
    this.logger.debug(`Getting admin: ${email}`);

    const admin = await this.usecase.execute(email);

    return getAdminByEmailPresenter(admin);
  }
}
