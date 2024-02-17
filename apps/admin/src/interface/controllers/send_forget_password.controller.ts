import { Logger } from 'winston';
import { Admin, AdminRepository } from '@zro/admin/domain';
import {
  HashProvider,
  NotificationService,
  SendForgetPasswordUseCase,
} from '@zro/admin/application';

export interface SendForgetPasswordRequest {
  email: string;
}

export interface SendForgetPasswordResponse {
  id: number;
  name: string;
  email: string;
  roleId: number;
  active: boolean;
  rrClass: string;
}

function sendForgetPasswordAdminPresenter(
  admin: Admin,
): SendForgetPasswordResponse {
  if (!admin) return null;

  const response: SendForgetPasswordResponse = {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    roleId: admin.roleId,
    active: admin.active,
    rrClass: admin.rrClass,
  };

  return response;
}

export class SendForgetPasswordController {
  private usecase: SendForgetPasswordUseCase;

  constructor(
    private logger: Logger,
    private adminRepository: AdminRepository,
    private notificationService: NotificationService,
    private hashProvider: HashProvider,
    private emailTag: string,
    private emailFrom: string,
    private randomNumberSize: number,
    private tokenAttempt: number,
  ) {
    this.logger = logger.child({
      context: SendForgetPasswordController.name,
    });
    this.usecase = new SendForgetPasswordUseCase(
      this.logger,
      this.adminRepository,
      this.notificationService,
      this.hashProvider,
      this.emailTag,
      this.emailFrom,
      this.randomNumberSize,
      this.tokenAttempt,
    );
  }

  async execute(
    request: SendForgetPasswordRequest,
  ): Promise<SendForgetPasswordResponse> {
    const { email } = request;

    this.logger.debug('Send forget email verification code.', { request });

    const result = await this.usecase.execute(email);

    return sendForgetPasswordAdminPresenter(result);
  }
}
