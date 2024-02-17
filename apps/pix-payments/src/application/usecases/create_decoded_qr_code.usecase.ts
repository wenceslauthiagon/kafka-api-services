import { Logger } from 'winston';
import {
  MissingDataException,
  ForbiddenException,
  getMoment,
} from '@zro/common';
import { User } from '@zro/users/domain';
import {
  DecodedQrCode,
  DecodedQrCodeEntity,
  DecodedQrCodeRepository,
  DecodedQrCodeState,
} from '@zro/pix-payments/domain';
import { UserNotFoundException } from '@zro/users/application';
import {
  BankingService,
  BankNotFoundException,
  DecodedQrCodeEventEmitter,
  DecodeQrCodePixPaymentPspRequest,
  PixPaymentGateway,
  UserService,
} from '@zro/pix-payments/application';

export class CreateDecodedQrCodeUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository DecodedQrCode repository.
   * @param eventEmitter DecodedQrCode event emitter.
   * @param pixPaymentGateway PSP gateway instance.
   * @param userService User service.
   * @param bankingService Banking service.
   */
  constructor(
    private logger: Logger,
    private readonly repository: DecodedQrCodeRepository,
    private readonly eventEmitter: DecodedQrCodeEventEmitter,
    private readonly pixPaymentGateway: PixPaymentGateway,
    private readonly userService: UserService,
    private readonly bankingService: BankingService,
  ) {
    this.logger = logger.child({ context: CreateDecodedQrCodeUseCase.name });
  }

  /**
   * Create a decoded QR code.
   *
   * @param id DecodedQrCode id.
   * @param user DecodedQrCode owner.
   * @param emv DecodedQrCode emv code.
   * @param paymentDate DecodedQrCode payment date.
   * @returns Qr code decoded.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {ForbiddenException} Thrown when userId is not the key owner.
   * @throws {InvalidDataFormatException} Thrown when type or key has invalid format.
   * @throws {UserNotFoundException} Thrown when user tries to add a key but he is canceled state.
   */
  async execute(
    id: string,
    user: User,
    emv: string,
    paymentDate?: Date,
  ): Promise<DecodedQrCode> {
    // Data input check
    if (!id || !user || !emv) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!user ? ['User'] : []),
        ...(!emv ? ['Emv'] : []),
      ]);
    }

    // Check if DecodedQrCode's ID is available
    const checkDecodedQrCode = await this.repository.getById(id);

    this.logger.debug('Check if DecodedQrCode exists.', {
      decodedQrCode: checkDecodedQrCode,
    });

    // Check idempotency
    if (checkDecodedQrCode) {
      if (checkDecodedQrCode.user.uuid !== user.uuid) {
        throw new ForbiddenException();
      }

      return checkDecodedQrCode;
    }

    const foundUser = await this.userService.getUserByUuid(user);

    this.logger.debug('User found by uuid.', { foundUser });

    if (!foundUser?.active) {
      throw new UserNotFoundException(user);
    }

    const params: DecodeQrCodePixPaymentPspRequest = {
      emv,
      decodedQrCodeId: id,
      document: foundUser.document,
      paymentDate,
    };

    const addedDecodedQrCode =
      await this.pixPaymentGateway.decodeQrCode(params);

    this.logger.debug('Gateway decode QR code response.', {
      decodedQrCode: addedDecodedQrCode,
    });

    if (!addedDecodedQrCode) {
      return null;
    }

    // Get recipientBankName and recipientBankIspb from banking service.
    const foundBank = await this.bankingService.getBankByIspb(
      addedDecodedQrCode.recipientIspb,
    );

    this.logger.debug('Found bank by user ispb.', { foundBank });

    if (!foundBank) {
      throw new BankNotFoundException({
        ispb: addedDecodedQrCode.recipientIspb,
      });
    }

    // DecodedQrCode is ready to be saved.
    const decodedQrCode = new DecodedQrCodeEntity({
      id,
      user,
      emv,
      paymentDate: paymentDate
        ? getMoment(paymentDate, 'YYYY-MM-DD').toDate()
        : getMoment().toDate(),
      state: DecodedQrCodeState.READY,
      document: foundUser.document,
      key: addedDecodedQrCode.key,
      txId: addedDecodedQrCode.txId,
      documentValue: addedDecodedQrCode.documentValue,
      additionalInfo: addedDecodedQrCode.additionalInfo,
      recipientName: addedDecodedQrCode.recipientName,
      recipientPersonType: addedDecodedQrCode.recipientPersonType,
      recipientDocument: addedDecodedQrCode.recipientDocument,
      recipientIspb: addedDecodedQrCode.recipientIspb,
      recipientBranch: addedDecodedQrCode.recipientBranch,
      recipientAccountType: addedDecodedQrCode.recipientAccountType,
      recipientAccountNumber: addedDecodedQrCode.recipientAccountNumber,
      recipientCity: addedDecodedQrCode.recipientCity,
      endToEndId: addedDecodedQrCode.endToEndId,
      type: addedDecodedQrCode.type,
      paymentValue: addedDecodedQrCode.paymentValue,
      allowUpdate: addedDecodedQrCode.allowUpdate,
      pss: addedDecodedQrCode.pss,
      expirationDate: addedDecodedQrCode.expirationDate,
      payerPersonType: addedDecodedQrCode.payerPersonType,
      payerDocument: addedDecodedQrCode.payerDocument,
      payerName: addedDecodedQrCode.payerName,
      status: addedDecodedQrCode.status,
      version: addedDecodedQrCode.version,
      additionalInfos: addedDecodedQrCode.additionalInfos,
      withdrawValue: addedDecodedQrCode.withdrawValue,
      changeValue: addedDecodedQrCode.changeValue,
      dueDate: addedDecodedQrCode.dueDate,
      interestValue: addedDecodedQrCode.interestValue,
      fineValue: addedDecodedQrCode.fineValue,
      deductionValue: addedDecodedQrCode.deductionValue,
      discountValue: addedDecodedQrCode.discountValue,
      recipientBankName: foundBank.name,
      recipientBankIspb: foundBank.ispb,
      agentIspbWithdrawal: addedDecodedQrCode.agentIspbWithdrawal,
      agentModWithdrawal: addedDecodedQrCode.agentModWithdrawal,
      agentIspbChange: addedDecodedQrCode.agentIspbChange,
      agentModChange: addedDecodedQrCode.agentModChange,
    });

    // Create decoded QR code
    const newDecodedQrCode = await this.repository.create(decodedQrCode);

    // Fire ReadyDecodedQrCodeEvent
    this.eventEmitter.readyDecodedQrCode(newDecodedQrCode);

    this.logger.debug('Created decoded QR code.', {
      decodedQrCode: newDecodedQrCode,
    });

    return newDecodedQrCode;
  }
}
