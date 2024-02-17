import { Logger } from 'winston';
import { GetAdminByIdUseCase } from '@zro/admin/application';
import { Admin, AdminRepository } from '@zro/admin/domain';
import { AutoValidator } from '@zro/common';
import { IsInt, IsString, MaxLength } from 'class-validator';

export type TGetAdminByIdRequest = Pick<Admin, 'id'>;

export class GetAdminByIdRequest
  extends AutoValidator
  implements TGetAdminByIdRequest
{
  @IsInt()
  id: number;

  constructor(props: TGetAdminByIdRequest) {
    super(props);
  }
}

export type TGetAdminByIdReponse = Pick<Admin, 'id' | 'name'>;

export class GetAdminByIdResponse
  extends AutoValidator
  implements TGetAdminByIdReponse
{
  @IsInt()
  id: number;

  @IsString()
  @MaxLength(255)
  name: string;

  constructor(props: TGetAdminByIdReponse) {
    super(props);
  }
}

export class GetAdminByIdController {
  private usecase: GetAdminByIdUseCase;

  constructor(
    private logger: Logger,
    adminRepository: AdminRepository,
  ) {
    this.logger = logger.child({
      context: GetAdminByIdController.name,
    });

    this.usecase = new GetAdminByIdUseCase(this.logger, adminRepository);
  }

  async execute(request: GetAdminByIdRequest): Promise<GetAdminByIdResponse> {
    const { id } = request;

    this.logger.debug('Get admin by id request', { request });

    const admin = await this.usecase.execute(id);

    const response =
      admin &&
      new GetAdminByIdResponse({
        id: admin.id,
        name: admin.name,
      });

    return response;
  }
}
