import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PaymentRepository,
  PixInfraction,
  PixInfractionType,
  PixInfractionStatus,
  PixInfractionRepository,
  PixInfractionEntity,
  PixInfractionState,
  PixDevolutionRepository,
} from '@zro/pix-payments/domain';
import { Operation, OperationEntity } from '@zro/operations/domain';
import { CreatePixInfractionUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PixInfractionEventEmitterControllerInterface,
  PixInfractionEventEmitterController,
} from '@zro/pix-payments/interface';

type OperationId = Pick<Operation, 'id'>['id'];

export type TCreatePixInfractionRequest = Pick<
  PixInfraction,
  'id' | 'issueId' | 'status' | 'description' | 'infractionType'
> & { operationId: OperationId };

export class CreatePixInfractionRequest
  extends AutoValidator
  implements TCreatePixInfractionRequest
{
  @IsUUID(4)
  id: string;

  @IsInt()
  @IsPositive()
  issueId: number;

  @IsUUID(4)
  operationId: OperationId;

  @IsEnum(PixInfractionStatus)
  status: PixInfractionStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description: string;

  @IsEnum(PixInfractionType)
  infractionType: PixInfractionType;

  constructor(props: TCreatePixInfractionRequest) {
    super(props);
  }
}

type TCreatePixInfractionResponse = Pick<
  PixInfraction,
  'id' | 'issueId' | 'state' | 'status'
>;

export class CreatePixInfractionResponse
  extends AutoValidator
  implements TCreatePixInfractionResponse
{
  @IsUUID(4)
  id: string;

  @IsInt()
  @IsPositive()
  issueId: number;

  @IsEnum(PixInfractionStatus)
  status: PixInfractionStatus;

  @IsEnum(PixInfractionState)
  state: PixInfractionState;

  constructor(props: TCreatePixInfractionResponse) {
    super(props);
  }
}

export class CreatePixInfractionController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    paymentRepository: PaymentRepository,
    infractionRepository: PixInfractionRepository,
    eventEmitter: PixInfractionEventEmitterControllerInterface,
    devolutionRepository: PixDevolutionRepository,
  ) {
    this.logger = logger.child({ context: CreatePixInfractionController.name });

    const controllerEventEmitter = new PixInfractionEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      paymentRepository,
      infractionRepository,
      controllerEventEmitter,
      devolutionRepository,
    );
  }

  async execute(
    request: CreatePixInfractionRequest,
  ): Promise<CreatePixInfractionResponse> {
    this.logger.debug('Create infraction request.', { request });

    const operation = new OperationEntity({ id: request.operationId });

    const { id, issueId, status, description, infractionType } = request;

    const infraction = new PixInfractionEntity({
      id,
      issueId,
      status,
      description,
      infractionType,
      operation,
    });

    const infractionCreated = await this.usecase.execute(infraction);

    if (!infractionCreated) return null;

    const response = new CreatePixInfractionResponse({
      id: infractionCreated.id,
      issueId: infractionCreated.issueId,
      state: infractionCreated.state,
      status: infractionCreated.status,
    });

    this.logger.info('Create infraction response.', {
      infraction: response,
    });

    return response;
  }
}
