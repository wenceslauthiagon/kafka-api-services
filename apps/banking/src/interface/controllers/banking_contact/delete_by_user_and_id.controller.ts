import { Logger } from 'winston';
import { IsInt, IsPositive } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  BankingAccountContact,
  BankingContactRepository,
  BankingAccountContactRepository,
} from '@zro/banking/domain';
import { User, UserEntity } from '@zro/users/domain';
import { DeleteBankingContactByIdUseCase as UseCase } from '@zro/banking/application';

type UserId = User['id'];

type TDeleteBankingAccountContactRequest = Pick<BankingAccountContact, 'id'> & {
  userId: UserId;
};

export class DeleteBankingAccountContactRequest
  extends AutoValidator
  implements TDeleteBankingAccountContactRequest
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsInt()
  @IsPositive()
  userId: number;

  constructor(props: TDeleteBankingAccountContactRequest) {
    super(props);
  }
}

export class DeleteBankingAccountContactController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankingContactRepository: BankingContactRepository,
    bankingAccountContactRepository: BankingAccountContactRepository,
  ) {
    this.logger = logger.child({
      context: DeleteBankingAccountContactController.name,
    });

    this.usecase = new UseCase(
      logger,
      bankingContactRepository,
      bankingAccountContactRepository,
    );
  }

  async execute(request: DeleteBankingAccountContactRequest): Promise<void> {
    const { id, userId } = request;

    this.logger.debug('Delete banking account ID and User request.', {
      request,
    });

    const user = new UserEntity({
      id: userId,
    });

    await this.usecase.execute(id, user);

    this.logger.debug('Deleted banking account.');
  }
}
