import { faker } from '@faker-js/faker/locale/pt_BR';
import { JdpiDecodeQrCodePixPaymentResponse } from '@zro/jdpi';
import {
  JdpiAccountType,
  JdpiPersonType,
  JdpiQRCodeStatus,
  JdpiErrorTypes,
  JdpiDecodeQrCodeType,
} from '@zro/jdpi/domain';

export const successStatic = () => {
  const data: Partial<JdpiDecodeQrCodePixPaymentResponse> = {
    endToEndId: faker.datatype.uuid(),
    tpQRCode: JdpiDecodeQrCodeType.QR_CODE_STATIC,
    dadosQrCodeEstatico: {
      ispb: faker.datatype.number({ min: 1, max: 99999 }),
      nrAgencia: faker.datatype.string(),
      tpConta: JdpiAccountType.CACC,
      nrConta: faker.datatype.string(),
      chave: faker.datatype.string(),
      codigoCategoria: faker.datatype.string(),
      valor: faker.datatype.number({ min: 1, max: 99999 }),
      nomeRecebedor: faker.name.fullName(),
      tpPessoaRecebedor: JdpiPersonType.NATURAL_PERSON,
      cpfCnpjRecebedor: faker.datatype.number({ min: 1, max: 99999 }),
      cidade: faker.datatype.string(),
      cep: faker.datatype.string(),
      idConciliacaoRecebedor: faker.datatype.string(),
      ispbFss: faker.datatype.number({ min: 1, max: 99999 }),
      dadosAdicionais: faker.datatype.string(),
    },
  };

  return Promise.resolve({ status: 200, data });
};

export const successDynamic = () => {
  const data: Partial<JdpiDecodeQrCodePixPaymentResponse> = {
    endToEndId: faker.datatype.uuid(),
    tpQRCode: JdpiDecodeQrCodeType.QR_CODE_DYNAMIC,
    dadosQrCodeDinamico: {
      revisao: 1,
      solicitacaoPagador: faker.name.fullName(),
      ispb: faker.datatype.number({ min: 1, max: 99999 }),
      nrAgencia: faker.datatype.string(),
      tpConta: JdpiAccountType.CACC,
      nrConta: faker.datatype.string(),
      chave: faker.datatype.uuid(),
      codigoCategoria: faker.datatype.string(),
      valorOriginal: faker.datatype.number({ min: 1, max: 99999 }),
      nomeRecebedor: faker.name.fullName(),
      tpPessoaRecebedor: JdpiPersonType.NATURAL_PERSON,
      cpfCnpjRecebedor: faker.datatype.number({ min: 1, max: 99999 }),
      cidade: faker.datatype.string(),
      cep: faker.datatype.string(),
      idConciliacaoRecebedor: faker.datatype.string(),
      ispbFss: faker.datatype.number({ min: 1, max: 99999 }),
      dadosAdicionais: [
        { nome: faker.datatype.string(), valor: faker.datatype.string() },
      ],
      dtHrCriacao: faker.datatype.datetime(),
      dtHrApresentacao: faker.datatype.datetime(),
      urlPspRecebedor: faker.datatype.string(),
      reutilizavel: true,
      modalidadeAltTroco: 1,
      status: JdpiQRCodeStatus.ACTIVE,
    },
  };

  return Promise.resolve({ status: 200, data });
};

export const successDynamicWithdrawal = () => {
  const data: Partial<JdpiDecodeQrCodePixPaymentResponse> = {
    endToEndId: faker.datatype.uuid(),
    tpQRCode: JdpiDecodeQrCodeType.QR_CODE_DYNAMIC,
    dadosQrCodeDinamico: {
      revisao: 1,
      solicitacaoPagador: faker.name.fullName(),
      ispb: faker.datatype.number({ min: 1, max: 99999 }),
      nrAgencia: faker.datatype.string(),
      tpConta: JdpiAccountType.CACC,
      nrConta: faker.datatype.string(),
      chave: faker.datatype.uuid(),
      codigoCategoria: faker.datatype.string(),
      valorOriginal: faker.datatype.number({ min: 1, max: 99999 }),
      nomeRecebedor: faker.name.fullName(),
      tpPessoaRecebedor: JdpiPersonType.NATURAL_PERSON,
      cpfCnpjRecebedor: faker.datatype.number({ min: 1, max: 99999 }),
      cidade: faker.datatype.string(),
      cep: faker.datatype.string(),
      idConciliacaoRecebedor: faker.datatype.string(),
      ispbFss: faker.datatype.number({ min: 1, max: 99999 }),
      ispbPssSaque: faker.datatype.number({ min: 1, max: 99999 }),
      dadosAdicionais: [
        { nome: faker.datatype.string(), valor: faker.datatype.string() },
      ],
      dtHrCriacao: faker.datatype.datetime(),
      dtHrApresentacao: faker.datatype.datetime(),
      urlPspRecebedor: faker.datatype.string(),
      reutilizavel: true,
      modalidadeAgSaque: faker.datatype.number({ min: 0, max: 2 }),
      modalidadeAgTroco: faker.datatype.number({ min: 0, max: 2 }),
      modalidadeAltSaque: 1,
      status: JdpiQRCodeStatus.ACTIVE,
    },
  };

  return Promise.resolve({ status: 200, data });
};

export const successDynamicChange = () => {
  const data: Partial<JdpiDecodeQrCodePixPaymentResponse> = {
    endToEndId: faker.datatype.uuid(),
    tpQRCode: JdpiDecodeQrCodeType.QR_CODE_DYNAMIC,
    dadosQrCodeDinamico: {
      revisao: 1,
      solicitacaoPagador: faker.name.fullName(),
      ispb: faker.datatype.number({ min: 1, max: 99999 }),
      nrAgencia: faker.datatype.string(),
      tpConta: JdpiAccountType.CACC,
      nrConta: faker.datatype.string(),
      chave: faker.datatype.string(),
      codigoCategoria: faker.datatype.string(),
      valorOriginal: faker.datatype.number({ min: 1, max: 99999 }),
      nomeRecebedor: faker.name.fullName(),
      tpPessoaRecebedor: JdpiPersonType.NATURAL_PERSON,
      cpfCnpjRecebedor: faker.datatype.number({ min: 1, max: 99999 }),
      cidade: faker.datatype.string(),
      cep: faker.datatype.string(),
      idConciliacaoRecebedor: faker.datatype.string(),
      ispbFss: faker.datatype.number({ min: 1, max: 99999 }),
      ispbPssTroco: faker.datatype.number({ min: 1, max: 99999 }),
      dadosAdicionais: [
        { nome: faker.datatype.string(), valor: faker.datatype.string() },
      ],
      dtHrCriacao: faker.datatype.datetime(),
      dtHrApresentacao: faker.datatype.datetime(),
      urlPspRecebedor: faker.datatype.string(),
      reutilizavel: true,
      status: JdpiQRCodeStatus.ACTIVE,
    },
  };

  return Promise.resolve({ status: 200, data });
};

export const successDueDate = () => {
  const data: Partial<JdpiDecodeQrCodePixPaymentResponse> = {
    endToEndId: faker.datatype.uuid(),
    tpQRCode: JdpiDecodeQrCodeType.QR_CODE_DYNAMIC_DUE_DATE,
    dadosQrCodeDinamicoCobv: {
      revisao: faker.datatype.number({ min: 1, max: 999 }),
      nomeFantasiaRecebedor: faker.datatype.string(),
      logradouroRecebedor: faker.datatype.string(),
      uf: faker.datatype.string(),
      solicitacaoPagador: faker.datatype.string(),
      cpfPagador: faker.datatype.string(),
      cnpjPagador: faker.datatype.string(),
      nomePagador: faker.name.fullName(),
      valorOriginal: faker.datatype.number({ min: 1, max: 999 }),
      abatimento: faker.datatype.number({ min: 1, max: 999 }),
      desconto: faker.datatype.number({ min: 1, max: 999 }),
      juros: faker.datatype.number({ min: 1, max: 999 }),
      multa: faker.datatype.number({ min: 1, max: 999 }),
      valorFinal: faker.datatype.number({ min: 1, max: 999 }),
      dtVenc: faker.datatype.string(),
      diasAposVenc: faker.datatype.number({ min: 1, max: 999 }),
      idConciliacaoRecebedor: faker.datatype.string(),
      dadosAdicionais: [
        { nome: faker.datatype.string(), valor: faker.datatype.string() },
      ],
      dtHrCriacao: faker.datatype.datetime(),
      dtHrApresentacao: faker.datatype.datetime(),
      urlPspRecebedor: faker.datatype.string(),
      reutilizavel: true,
      status: JdpiQRCodeStatus.ACTIVE,
      ispb: 0,
      tpConta: JdpiAccountType.CACC,
      nrConta: faker.datatype.string(),
      chave: faker.datatype.uuid(),
      nomeRecebedor: faker.name.fullName(),
      tpPessoaRecebedor: JdpiPersonType.NATURAL_PERSON,
      cidade: faker.name.fullName(),
    },
  };

  return Promise.resolve({ status: 200, data });
};

export const invalidQrCodeType = () => {
  const data: Partial<JdpiDecodeQrCodePixPaymentResponse> = {
    endToEndId: faker.datatype.uuid(),
    tpQRCode: 999 as any,
    dadosQrCodeDinamicoCobv: {
      revisao: faker.datatype.number({ min: 1, max: 999 }),
      nomeFantasiaRecebedor: faker.datatype.string(),
      logradouroRecebedor: faker.datatype.string(),
      uf: faker.datatype.string(),
      solicitacaoPagador: faker.datatype.string(),
      cpfPagador: faker.datatype.string(),
      cnpjPagador: faker.datatype.string(),
      nomePagador: faker.name.fullName(),
      valorOriginal: faker.datatype.number({ min: 1, max: 999 }),
      abatimento: faker.datatype.number({ min: 1, max: 999 }),
      desconto: faker.datatype.number({ min: 1, max: 999 }),
      juros: faker.datatype.number({ min: 1, max: 999 }),
      multa: faker.datatype.number({ min: 1, max: 999 }),
      valorFinal: faker.datatype.number({ min: 1, max: 999 }),
      dtVenc: faker.datatype.string(),
      diasAposVenc: faker.datatype.number({ min: 1, max: 999 }),
      idConciliacaoRecebedor: faker.datatype.string(),
      dadosAdicionais: [
        { nome: faker.datatype.string(), valor: faker.datatype.string() },
      ],
      dtHrCriacao: faker.datatype.datetime(),
      dtHrApresentacao: faker.datatype.datetime(),
      urlPspRecebedor: faker.datatype.string(),
      reutilizavel: true,
      status: JdpiQRCodeStatus.ACTIVE,
      ispb: 0,
      tpConta: JdpiAccountType.CACC,
      nrConta: faker.datatype.string(),
      chave: faker.datatype.uuid(),
      nomeRecebedor: faker.name.fullName(),
      tpPessoaRecebedor: JdpiPersonType.NATURAL_PERSON,
      cidade: faker.name.fullName(),
    },
  };

  return Promise.resolve({ status: 200, data });
};

export const offline = () => {
  const error = {
    response: {
      data: {
        codigo: JdpiErrorTypes.SERVICE_UNAVAILABLE,
        message: 'An error occurred while sending the request',
      },
    },
  };
  return Promise.reject(error);
};

export const unexpectedError = () => {
  const error = {
    response: {
      data: {
        codigo: 'Unexpected Error',
        message: 'An error occurred while sending the request',
      },
    },
  };
  return Promise.reject(error);
};

export const timeoutError = () => {
  const error = {
    response: {
      data: {
        codigo: JdpiErrorTypes.DECODE_QR_CODE_TIMEOUT,
        mensagem: 'Tempo de consulta excedido',
      },
    },
  };
  return Promise.reject(error);
};
