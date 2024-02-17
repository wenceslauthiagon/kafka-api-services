import { Logger } from 'winston';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { IsIsoStringDateFormat, AutoValidator } from '@zro/common';
import { Operation, Wallet, WalletEntity } from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';
import { QuotationEntity } from '@zro/quotations/domain';
import {
  Conversion,
  ConversionRepository,
  CryptoOrderRepository,
  SystemRepository,
} from '@zro/otc/domain';
import {
  CreateConversionUseCase as UseCase,
  OperationService,
  QuotationService,
  UserService,
} from '@zro/otc/application';
import {
  ConversionEventEmitterController,
  CryptoOrderEventEmitterController,
  ConversionEventEmitterControllerInterface,
  CryptoOrderEventEmitterControllerInterface,
} from '@zro/otc/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];

export type TCreateConversionRequest = Pick<Conversion, 'id'> & {
  userId: UserId;
  walletId: string;
  quotationId: string;
  systemName: string;
};

export class CreateConversionRequest
  extends AutoValidator
  implements TCreateConversionRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  walletId: WalletId;

  @IsUUID(4)
  quotationId: string;

  @IsUUID(4)
  userId: UserId;

  @IsOptional()
  @IsString()
  systemName: string;

  constructor(props: TCreateConversionRequest) {
    super(props);
  }
}

type TCreateConversionResponse = Pick<Conversion, 'id' | 'createdAt'> & {
  operationId: OperationId;
};

export class CreateConversionResponse
  extends AutoValidator
  implements TCreateConversionResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  operationId: OperationId;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt?: Date;

  constructor(props: TCreateConversionResponse) {
    super(props);
  }
}

export class CreateConversionController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    conversionRepository: ConversionRepository,
    cryptoOrderRepository: CryptoOrderRepository,
    systemRepository: SystemRepository,
    serviceConversionEmitter: ConversionEventEmitterControllerInterface,
    serviceCryptoOrderEmitter: CryptoOrderEventEmitterControllerInterface,
    userService: UserService,
    operationService: OperationService,
    quotationService: QuotationService,
    conversionOperationTransactionTag: string,
    conversionDepositOperationDescription: string,
    conversionWithdrawalOperationDescription: string,
    conversionSystemName: string,
    symbolCurrencyMidQuote: string,
  ) {
    this.logger = logger.child({
      context: CreateConversionController.name,
    });
    const conversionEventEmitter = new ConversionEventEmitterController(
      serviceConversionEmitter,
    );
    const cryptoOrderEventEmitter = new CryptoOrderEventEmitterController(
      serviceCryptoOrderEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      conversionRepository,
      cryptoOrderRepository,
      systemRepository,
      conversionEventEmitter,
      cryptoOrderEventEmitter,
      userService,
      operationService,
      quotationService,
      conversionOperationTransactionTag,
      conversionDepositOperationDescription,
      conversionWithdrawalOperationDescription,
      conversionSystemName,
      symbolCurrencyMidQuote,
    );
  }

  async execute(
    request: CreateConversionRequest,
  ): Promise<CreateConversionResponse> {
    this.logger.debug('Create conversion request.', { request });

    const { id, quotationId, walletId, userId, systemName } = request;

    const user = new UserEntity({ uuid: userId });
    const wallet = new WalletEntity({ uuid: walletId });
    const quotation = new QuotationEntity({ id: quotationId });

    const conversion = await this.usecase.execute(
      id,
      user,
      wallet,
      quotation,
      systemName,
    );

    const response = new CreateConversionResponse({
      id: conversion.id,
      operationId: conversion.operation?.id,
      createdAt: conversion.createdAt,
    });

    this.logger.info('Created conversion response.', { conversion: response });

    return response;
  }
}
