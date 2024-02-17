import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsUUID,
  IsBoolean,
  IsObject,
  IsString,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  Provider,
  Remittance,
  RemittanceRepository,
  RemittanceSide,
  RemittanceStatus,
  RemittanceType,
  System,
} from '@zro/otc/domain';
import { GetRemittanceByIdUseCase } from '@zro/otc/application';

type TGetRemittanceByIdRequest = Pick<Required<Remittance>, 'id'>;

export class GetRemittanceByIdRequest
  extends AutoValidator
  implements TGetRemittanceByIdRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: TGetRemittanceByIdRequest) {
    super(props);
  }
}

type TGetRemittanceByIdResponse = Pick<
  Remittance,
  | 'id'
  | 'side'
  | 'type'
  | 'amount'
  | 'status'
  | 'bankQuote'
  | 'iof'
  | 'system'
  | 'resultAmount'
  | 'provider'
  | 'sendDate'
  | 'receiveDate'
  | 'isConcomitant'
  | 'createdAt'
  | 'updatedAt'
> & {
  systemId: System['id'];
  providerId?: Provider['id'];
  currencyId: Currency['id'];
  exchangeContractId?: string;
};

export class GetRemittanceByIdResponse
  extends AutoValidator
  implements TGetRemittanceByIdResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(RemittanceSide)
  side: RemittanceSide;

  @IsEnum(RemittanceType)
  type: RemittanceType;

  @IsPositive()
  amount: number;

  @IsEnum(RemittanceStatus)
  status: RemittanceStatus;

  @IsUUID(4)
  systemId: System['id'];

  @IsInt()
  @IsPositive()
  currencyId: Currency['id'];

  @IsOptional()
  @IsPositive()
  bankQuote?: number;

  @IsOptional()
  @IsUUID(4)
  providerId?: Provider['id'];

  @IsObject()
  @IsOptional()
  system: System;

  @IsObject()
  @IsOptional()
  provider: Provider;

  @IsInt()
  @IsOptional()
  iof: number;

  @IsInt()
  @IsOptional()
  resultAmount: number;

  @IsString()
  @IsOptional()
  exchangeContractId?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format sendDate',
  })
  sendDate: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format receiveDate',
  })
  receiveDate: Date;

  @IsBoolean()
  @IsOptional()
  isConcomitant?: boolean;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format updatedAt',
  })
  updatedAt: Date;

  constructor(props: TGetRemittanceByIdResponse) {
    super(props);
  }
}

export class GetRemittanceByIdController {
  private usecase: GetRemittanceByIdUseCase;

  constructor(
    private logger: Logger,
    private remittanceRepository: RemittanceRepository,
  ) {
    this.logger = logger.child({
      context: GetRemittanceByIdController.name,
    });

    this.usecase = new GetRemittanceByIdUseCase(
      this.logger,
      this.remittanceRepository,
    );
  }

  async execute(
    request: GetRemittanceByIdRequest,
  ): Promise<GetRemittanceByIdResponse> {
    this.logger.debug('Getting crypto remittance', { request });

    const result = await this.usecase.execute(request.id);

    return new GetRemittanceByIdResponse({
      id: result.id,
      side: result.side,
      amount: result.amount,
      status: result.status,
      type: result.type,
      bankQuote: result.bankQuote,
      currencyId: result.currency.id,
      systemId: result.system.id,
      providerId: result.provider?.id,
      resultAmount: result.resultAmount,
      system: result.system,
      provider: result.provider,
      iof: result.iof,
      receiveDate: result.receiveDate,
      exchangeContractId: result.exchangeContract?.id,
      isConcomitant: result.isConcomitant,
      sendDate: result.sendDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });
  }
}
