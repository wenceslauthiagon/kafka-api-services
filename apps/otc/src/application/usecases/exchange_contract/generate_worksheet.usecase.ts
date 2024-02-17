import * as fs from 'fs';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { AxiosInstance } from 'axios';
import { createRandomCode, generateWorksheet, getMoment } from '@zro/common';
import { File } from '@zro/storage/domain';
import {
  GetExchangeContractFilter,
  ExchangeContractRepository,
} from '@zro/otc/domain';
import {
  ExchangeContractWorksheetNotFoundException,
  ExchangeContractsNotFoundByFilterException,
  StorageService,
} from '@zro/otc/application';

enum PortugueseTranslation {
  dateTime = 'DATA/HORÁRIO',
  totalAmount = 'VALOR TOTAL',
  contractNumber = 'CONTRATO/BACEN',
  quotation = 'COTAÇÃO',
  vetQuote = 'COTAÇÃO VET',
}

export class GenerateExchangeContractWorksheetUseCase {
  private file: Buffer;
  private folder = 'exchange-contracts';

  /**
   * Default constructor.
   * @param {Logger} logger Global logger instance.
   * @param {ExchangeContractRepository} exchangeContractRepository ExchangeContract repository.
   * @param {StorageService} storageService Storage service instance which calls gateway.
   * @param {AxiosInstance} axiosInstance Axios instance.
   */
  constructor(
    private logger: Logger,
    private readonly exchangeContractRepository: ExchangeContractRepository,
    private storageService: StorageService,
    private axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: GenerateExchangeContractWorksheetUseCase.name,
    });
  }

  /**
   * Generate Remittance Orders Worksheet UseCase.
   * @param {GetExchangeContractFilter} filter filter params.
   * @param {String} search? optional search param.
   * @returns {File} File Entity.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    filter: GetExchangeContractFilter,
    search?: string,
  ): Promise<File> {
    // Threating date
    const threatedCreatedAt = {
      ...(filter?.createdAt?.start && {
        start: getMoment(filter.createdAt.start).startOf('day').toDate(),
      }),
      ...(filter?.createdAt?.end && {
        end: getMoment(filter.createdAt.end).startOf('day').toDate(),
      }),
    };

    const exchangeContracts =
      await this.exchangeContractRepository.getAllByFilter(
        { ...filter, createdAt: threatedCreatedAt },
        search,
      );

    this.logger.debug('Found remittance orders.', {
      ExchangeContracts: exchangeContracts,
    });

    if (!exchangeContracts.length)
      throw new ExchangeContractsNotFoundByFilterException({
        ...filter,
        createdAt: threatedCreatedAt,
      });

    const threatedData = exchangeContracts.map((ec) => {
      return {
        [PortugueseTranslation.dateTime]: ec.createdAt,
        [PortugueseTranslation.totalAmount]: ec.totalAmount,
        [PortugueseTranslation.contractNumber]: ec.contractNumber,
        [PortugueseTranslation.quotation]: ec.contractQuote,
        [PortugueseTranslation.vetQuote]: ec.vetQuote,
      };
    });

    const filePath = `${createRandomCode(8)}_Contratos_de_Cambio.xlsx`;

    // Generate file worksheet
    generateWorksheet([threatedData], filePath, 'Contrato de Câmbio ');

    try {
      this.file = fs.readFileSync(filePath);
    } catch (error) {
      this.logger.error('Error when get file.', error);
      throw new ExchangeContractWorksheetNotFoundException('File not found');
    }

    this.logger.debug('Create remittance order worksheet file', {
      filePath,
    });

    // Delete worksheet generated from disk
    fs.unlinkSync(filePath);

    // Send file to storage microservice
    const result = await this.storageService.uploadFile(
      uuidV4(),
      this.file,
      this.folder,
      filePath,
      this.axiosInstance,
    );

    return result;
  }
}
