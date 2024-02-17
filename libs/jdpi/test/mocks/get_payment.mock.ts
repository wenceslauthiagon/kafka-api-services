import { faker } from '@faker-js/faker';
import { JdpiErrorTypes } from '@zro/jdpi/domain';

export const success = () => {
  return Promise.resolve({
    status: 200,
    data: {
      endToEndId: faker.datatype.uuid(),
      endToEndIdOriginal: faker.datatype.uuid(),
      ispbPspDireto: faker.random.word(),
      tpLanc: faker.datatype.number({ min: 1, max: 99999 }),
      stLanc: faker.datatype.number({ min: 0, max: 9 }) <= 4 ? 0 : 9,
      dtHrSituacao: faker.datatype.datetime(),
      nomeMsgOrigem: faker.name.fullName(),
      tpIniciacao: faker.datatype.number({ min: 1, max: 99999 }),
      prioridadePagamento: faker.datatype.number({ min: 1, max: 99999 }),
      tpPrioridadePagamento: faker.datatype.number({ min: 1, max: 99999 }),
      finalidade: faker.datatype.number({ min: 1, max: 99999 }),
      modalidadeAgente: faker.datatype.number({ min: 1, max: 99999 }),
      ispbPss: faker.random.word(),
      cnpjIniciadorPagamento: faker.datatype.number(99999999999999).toString(),
      tpAgente: faker.datatype.number({ min: 1, max: 99999 }),
      ispbOrigemLanc: faker.datatype.number({ min: 1, max: 99999 }),
      valor: faker.datatype.number({ min: 1, max: 99999 }),
      vlrDetalhe: {
        vlrTarifaDinheiroCompra: faker.datatype.number({ min: 1, max: 99999 }),
        tipo: faker.datatype.number({ min: 1, max: 99999 }),
      },
      pagador: {
        ispb: faker.random.word(),
        tpPessoa: faker.datatype.number({ min: 1, max: 99999 }),
        cpfCnpj: faker.datatype.number(99999999999999).toString(),
        nome: faker.name.fullName(),
        nrAgencia: faker.datatype.number(9999).toString().padStart(4, '0'),
        tpConta: faker.datatype.number({ min: 1, max: 99999 }),
        nrConta: faker.datatype.number(99999).toString().padStart(5, '0'),
      },
      recebedor: {
        ispb: faker.random.word(),
        tpPessoa: faker.datatype.number({ min: 1, max: 99999 }),
        cpfCnpj: faker.datatype.number(99999999999).toString(),
        nrAgencia: faker.datatype.number(9999).toString().padStart(4, '0'),
        tpConta: faker.datatype.number({ min: 1, max: 99999 }),
        nrConta: faker.datatype.number(99999).toString().padStart(5, '0'),
      },
      dataContabil: faker.datatype.datetime(),
      chave: faker.datatype.uuid(),
      idConciliacaoRecebedor: faker.datatype.uuid(),
      infEntreClientes: faker.datatype.string(),
      codigoDevolucao: faker.datatype.uuid(),
      motivoDevolucao: faker.datatype.string(),
      codigoErro: faker.datatype.uuid(),
      detalheCodigoErro: faker.datatype.string(),
    },
  });
};

export const offline = () => {
  const error = {
    response: {
      data: {
        codigo: JdpiErrorTypes.SERVICE_UNAVAILABLE,
        message: 'Fake offline',
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

export const notFound = () => {
  const error = {
    response: {
      status: 404,
      data: {
        codigo: '404',
        mensagem: 'Lançamento não encontrado no SPI.',
      },
    },
  };
  return Promise.reject(error);
};

export const invalidLaunchSituation = () => {
  return Promise.resolve({
    status: 200,
    data: {
      endToEndId: faker.datatype.uuid(),
      endToEndIdOriginal: faker.datatype.uuid(),
      ispbPspDireto: faker.random.word(),
      tpLanc: faker.datatype.number({ min: 1, max: 99999 }),
      stLanc: 99,
      dtHrSituacao: faker.datatype.datetime(),
      nomeMsgOrigem: faker.name.fullName(),
      tpIniciacao: faker.datatype.number({ min: 1, max: 99999 }),
      prioridadePagamento: faker.datatype.number({ min: 1, max: 99999 }),
      tpPrioridadePagamento: faker.datatype.number({ min: 1, max: 99999 }),
      finalidade: faker.datatype.number({ min: 1, max: 99999 }),
      modalidadeAgente: faker.datatype.number({ min: 1, max: 99999 }),
      ispbPss: faker.random.word(),
      cnpjIniciadorPagamento: faker.datatype.number(99999999999999).toString(),
      tpAgente: faker.datatype.number({ min: 1, max: 99999 }),
      ispbOrigemLanc: faker.datatype.number({ min: 1, max: 99999 }),
      valor: faker.datatype.number({ min: 1, max: 99999 }),
      vlrDetalhe: {
        vlrTarifaDinheiroCompra: faker.datatype.number({ min: 1, max: 99999 }),
        tipo: faker.datatype.number({ min: 1, max: 99999 }),
      },
      pagador: {
        ispb: faker.random.word(),
        tpPessoa: faker.datatype.number({ min: 1, max: 99999 }),
        cpfCnpj: faker.datatype.number(99999999999999).toString(),
        nome: faker.name.fullName(),
        nrAgencia: faker.datatype.number(9999).toString().padStart(4, '0'),
        tpConta: faker.datatype.number({ min: 1, max: 99999 }),
        nrConta: faker.datatype.number(99999).toString().padStart(5, '0'),
      },
      recebedor: {
        ispb: faker.random.word(),
        tpPessoa: faker.datatype.number({ min: 1, max: 99999 }),
        cpfCnpj: faker.datatype.number(99999999999).toString(),
        nrAgencia: faker.datatype.number(9999).toString().padStart(4, '0'),
        tpConta: faker.datatype.number({ min: 1, max: 99999 }),
        nrConta: faker.datatype.number(99999).toString().padStart(5, '0'),
      },
      dataContabil: faker.datatype.datetime(),
      chave: faker.datatype.uuid(),
      idConciliacaoRecebedor: faker.datatype.uuid(),
      infEntreClientes: faker.datatype.string(),
      codigoDevolucao: faker.datatype.uuid(),
      motivoDevolucao: faker.datatype.string(),
      codigoErro: faker.datatype.uuid(),
      detalheCodigoErro: faker.datatype.string(),
    },
  });
};
